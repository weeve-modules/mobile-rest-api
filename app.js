const { formatTimeDiff } = require('./utils/util')
const ObjectId = require('mongodb').ObjectID
const {
  getUserPasswordByName,
  getLocationByLocationID,
  getDeviceByDeviceID,
  updateRoomTemperature,
  toggleOnOffRoom,
  updateRoomName,
  updateRoomPlan,
  getDevicesList,
} = require('./utils/mongodb')
const config = require('config')
const winston = require('winston')
const expressWinston = require('express-winston')
const express = require('express')

const settings = config[process.env.NODE_ENV]

// initialization
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// logger
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Console(),
      /*
    new winston.transports.File({
        filename: 'logs/scheduler.log'
    })
    */
    ],
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) {
      return false
    }, // optional: allows to skip some log messages based on request and/or response
  })
)
const startTime = Date.now()
// health check
app.get('/health', async (req, res) => {
  res.json({
    serverStatus: 'Running',
    uptime: formatTimeDiff(Date.now(), startTime),
  })
})

app.post('/devices', async (req, res) => {
  const json = req.body
  const devices = await getDevicesList(json.location)
  res.send({
    data: devices,
  })
})

app.post('/checkUser', async (req, res) => {
  getUserPasswordByName('user', req.body.email, req.body.password).then(async response => {
    res.send(response)
    // ;
  })
})

app.post('/getLocationsUser', async (req, res) => {
  getLocationByLocationID('location', req.body.locationID).then(async response => {
    res.send(response)
    // ;
  })
})

app.post('/getDevicesUser', async (req, res) => {
  getDeviceByDeviceID('device', req.body.deviceID).then(async response => {
    res.send(response)
  })
})

app.post('/updateRoomTemperature', async (req, res) => {
  updateRoomTemperature('device', ObjectId(req.body.idSensor), {
    manualTemperature: {
      command: {
        name: 'setTemperatur',
        params: {
          value: req.body.temperature,
          until: '1970-01-01T00:00:00.000Z',
        },
      },
    },
  }).then(async response => {
    res.send(response)
  })
})

app.post('/toggleOnOffRoom', async (req, res) => {
  toggleOnOffRoom('device', ObjectId(req.body.idSensor), {
    isOn: req.body.isOn,
  }).then(async response => {
    res.send(response)
  })
})

app.post('/updateRoomName', async (req, res) => {
  updateRoomName('device', ObjectId(req.body.idSensor), {
    label: req.body.nameRoom,
  }).then(async response2 => {})
})

app.post('/updateRoomPlan', async (req, res) => {
  updateRoomPlan('device', ObjectId(req.body.idSensor), {
    schedule: req.body.scheduleSensor,
  }).then(async response2 => {})
})

// handle exceptions
app.use(async (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  const errCode = err.status || 401
  res.status(errCode).send({
    status: false,
    message: err.message,
  })
})

if (require.main === module) {
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Service listening on ${settings.PORT}`)
  })
}
