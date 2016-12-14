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
  res.end('Hello')
})

app.listen(port, function () {
  console.log(`Server running at http://127.0.0.1:${port}/`)
})
