const fetch = require('node-fetch')
const config = require('config')
const settings = config[process.env.NODE_ENV || 'prod']

const formatTimeDiff = (t1, t2) => {
  const diff = Math.max(t1, t2) - Math.min(t1, t2)
  const SEC = 1000
  const MIN = 60 * SEC
  const HRS = 60 * MIN
  const hrs = Math.floor(diff / HRS)
  const min = Math.floor((diff % HRS) / MIN).toLocaleString('en-US', { minimumIntegerDigits: 2 })
  const sec = Math.floor((diff % MIN) / SEC).toLocaleString('en-US', { minimumIntegerDigits: 2 })
  const ms = Math.floor(diff % SEC).toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false })
  return `${hrs}:${min}:${sec}`
}

const translateCommand = async command => {
  const payload = {
    manufacturer: settings.MANUFACTURER_NAME,
    device_type: settings.MANUFACTURER_DEVICE_TYPE,
    command,
  }
  console.log(JSON.stringify(payload))
  const res = await fetch(settings.TRANSLATION_SERVICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (res.ok) {
    const json = await res.json()
    if (json.status) return json.data
    else return false
  } else return false
}

const sendCommand = async (deviceEUI, command) => {
  const payload = {
    command: {
      name: settings.MELITA_COMMAND,
      deviceEUI: deviceEUI,
      params: {
        confirmed: true,
        data: {
          command,
        },
        devEUI: deviceEUI,
        fPort: 1,
      },
    },
  }
  console.log(settings.ENCODER_SERVICE_URL)
  console.log(JSON.stringify(payload))
  const res = await fetch(settings.ENCODER_SERVICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (res.ok) {
    const json = await res.json()
    console.log(json)
    return true
  } else return false
}

const queryInfluxDB = async devEUI => {
  try {
    const query = {
      query: `|> range(start: -10m, stop:-1m) |> filter(fn: (r) => r._measurement == "http_listener_v2") |> filter(fn: (r) => r._field == "sensorTemperature") |> filter(fn: (r) => r["devEUI"] == "${devEUI.toLowerCase()}")`,
    }
    const res = await fetch(settings.INFLUXDB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.status) return json.data
      else return false
    } else return false
  } catch (e) {
    return false
  }
}

module.exports = {
  formatTimeDiff,
  translateCommand,
  sendCommand,
  queryInfluxDB,
}
