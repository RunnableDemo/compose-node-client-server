'use strict'

const bluebird = require('bluebird')
const express = require('express')
const app = express()

const redis = require('redis')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)
const r = require('rethinkdb')
require('rethinkdb-init')(r)

const j = (obj) => JSON.stringify(obj, null, '  ')

const port = parseInt(process.env.PORT || 80, 10)

app.get('/', function (req, res) {
  let opts = {
    IS_MIRRORED_DOCKERFILE: process.env.IS_MIRRORED_DOCKERFILE,
    RUNNABLE_CONTAINER_ID: process.env.RUNNABLE_CONTAINER_ID,
    HOSTNAME: process.env.HOSTNAME,
    RETHINKDB: process.env.RETHINKDB,
    REDIS_HOST: process.env.REDIS_HOST
  }
  res.writeHead(200, {'Content-Type': 'text/plain'})
  if (!process.env.RETHINKDB) {
    console.log('No `RETHINKDB` ENV vars set')
    res.end(j({
      message: 'Hello: No RethinkDB Variables set',
      opts: opts
    }))
  }
  if (!process.env.REDIS_HOST) {
    console.log('No `REDIS_HOST` ENV vars set')
    res.end(j({
      message: 'Hello: No REDIS_HOST Variables set',
      opts: opts
    }))
  }
  const redisClient = redis.createClient({
    host: process.env.REDIS_HOST
  })
  console.log('Connecting to Rethinkdb...')
  r.init({
    host: process.env.RETHINKDB,
    db: process.env.DB_NAME || 'hello_node_rethinkdb'
  }, [
    'hello_world',
    process.env.TABLE_NAME || 'master'
  ])
    .then(function (conn) {
      console.log('Getting db list...')
      return Promise.all([
        r.dbList().run(conn),
        r.tableList().run(conn),
        redisClient.incrAsync('hits')])
    })
    .spread(function (dbList, tableList, hits) {
      console.log('DB list...', dbList)
      res.end(j({
        message: 'Hello: Succesfully connected to Rethink and Redis',
        opts: opts,
        dbList: dbList,
        tableList,
        hits: `You hit this page ${hits} times`
      }))
    })
    .catch(function (err) {
      console.log('Error: ', err)
      res.end(j({
        message: 'Hello: Error connecting to Rethink or Redis',
        opts: opts,
        err: err
      }))
    })
})

app.get('/status', function (req, res) {
  const redisClient = redis.createClient({
    host: process.env.REDIS_HOST
  })
  redisClient.incrAsync('hits')
  .then((hits) => {
    return res.json({
      status: 'ok',
      hits: hits
    })
  })
  .catch((err) => {
    return res.json({
      status: 'error',
      message: err.message
    })
  })
})

app.listen(port, function () {
  console.log(`Server running at http://127.0.0.1:${port}/`)
})
