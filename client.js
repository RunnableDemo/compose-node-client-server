'use strict'

const bluebird = require('bluebird')
const express = require('express')
const app = express()

const redis = require('redis')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)
const rp = require('request-promise')

const port = parseInt(process.env.PORT || 80, 10)

app.get('/', function (req, res) {
  console.log('server url to hit', process.env.SERVER_HOST)
  const serverUrl = `http://${process.env.SERVER_HOST}:7000`
  if (!process.env.REDIS_HOST) {
    console.log('No `REDIS_HOST` ENV vars set')
    return res.json({
      message: 'Hello: No REDIS_HOST Variables set'
    })
  }
  const redisClient = redis.createClient({
    host: process.env.REDIS_HOST
  })
  return Promise.all([
    rp(serverUrl),
    redisClient.incrAsync('client-hits')]
  )
  .then((resp) => {
    const serverResp = resp[0]
    const clientHits = resp[1]
    const jsonResp = JSON.parse(serverResp)
    res.json({
      status: 'ok',
      serverHits: jsonResp.hits,
      clientHits
    })
  })
  .catch((err) => {
    res.json({
      status: 'error',
      message: err.message
    })
  })
})

app.listen(port, function () {
  console.log(`Server running at http://127.0.0.1:${port}/`)
})
