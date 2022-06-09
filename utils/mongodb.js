const { MongoClient } = require('mongodb')
const config = require('config')
const ObjectId = require('mongodb').ObjectID
const settings = config[process.env.NODE_ENV || 'prod']

let MONGO_DB_URL = `mongodb://${settings.MONGO_DB_HOST}/${settings.MONGO_DB_NAME}?authSource=${settings.MONGO_DB_NAME}`
if (settings.MONGO_DB_USERNAME !== '')
  MONGO_DB_URL = `mongodb://${settings.MONGO_DB_USERNAME}:${settings.MONGO_DB_PASSWORD}@${settings.MONGO_DB_HOST}/${settings.MONGO_DB_NAME}?authSource=${settings.MONGO_DB_NAME}`

const client = new MongoClient(MONGO_DB_URL)
client.connect()
const database = client.db(settings.MONGO_DB_NAME)

const getLocations = async () => {
  try {
    const list = await database.collection('location').find().toArray()
    let r = []
    if (list.length) {
      for (let i = 0; i < list.length; i++) r.push(list[0]._id)
    }
    return r
  } catch (e) {
    console.log(e)
    return false
  }
}
// Get Username and Password
const getUserPasswordByName = async (collectionname, _email, _password) => {
  try {
    const users = await database.collection(collectionname)

    const cursor = users.find({ email: _email })
    if ((await cursor.count()) === 0) {
      return { nofound: true }
    }

    let currentUser

    await cursor.forEach(user => {
      currentUser = user
    })

    if (currentUser.password !== _password) {
      return { falsepassword: true }
    } else {
      return currentUser
    }
  } finally {
    // await client.close();
  }
}

// Get Location by LocationID
const getLocationByLocationID = async (collectionname, _locationID) => {
  try {
    const locations = await database.collection(collectionname)

    const newobj = {
      _id: ObjectId(_locationID),
    }
    const collection = locations.find(newobj)
    if ((await collection.count()) === 0) {
      return { nofound: true }
    }

    let currentLocation

    await collection.forEach(location => {
      currentLocation = location
    })
    return currentLocation
  } finally {
    // await client.close();
  }
}

// Get Sensor by SensorID
const getDeviceByDeviceID = async (collectionname, _sensorID) => {
  try {
    const sensors = await database.collection(collectionname)

    const newobj = {
      _id: ObjectId(_sensorID),
    }

    const collection = sensors.findOne(newobj)

    // if ((await collection.count()) === 0) {
    // return { nofound: true };
    // } else {
    const currentSensor = collection
    // console.log(currentSensor);
    // console.log(currentSensor);
    return currentSensor
    // }

    // var currentSensor = [];

    // await collection
    //   .forEach((sensor) => {
    //     if (sensor["_id"].toString() === newobj._id.toString()) {
    //       currentSensor = sensor;
    //       console.log(currentSensor);
    //     } else {
    //       return { nofound: true };
    //     }
    //   })
    //   .then((res) => {
    //     console.log(res);
    //     console.log(currentSensor);
    //     return currentSensor;
    //   });
  } finally {
    // await client.close();
  }
}

// Update Room Temperature
const updateRoomTemperature = async (collectioname, nameOfListing, _newData) => {
  try {
    const result = await database.collection(collectioname).updateOne({ _id: nameOfListing }, { $set: _newData })

    console.log(`${result.matchedCount} document(s) matched the query criteria.`)
    console.log(`${result.modifiedCount} document(s) was/were updated.`)

    return { update: true }
  } finally {
    // await client.close();
  }
}

// Toggle Room - On / Off
const toggleOnOffRoom = async (collectioname, nameOfListing, _newData) => {
  try {
    const result = await database.collection(collectioname).updateOne({ _id: nameOfListing }, { $set: _newData })

    console.log(`${result.matchedCount} document(s) matched the query criteria.`)
    console.log(`${result.modifiedCount} document(s) was/were updated.`)

    return { update: true }
  } finally {
    // await client.close();
  }
}

// Update Room Name
const updateRoomName = async (collectioname, nameOfListing, _newData) => {
  try {
    const result = await database.collection(collectioname).updateOne({ _id: nameOfListing }, { $set: _newData })
    console.log(`${result.matchedCount} document(s) matched the query criteria.`)
    console.log(`${result.modifiedCount} document(s) was/were updated.`)

    return { update: true }
  } finally {
    // await client.close();
  }
}

// Update Room Plan
const updateRoomPlan = async (collectionname, nameOfListing, _newData) => {
  try {
    const result = await database.collection(collectionname).updateOne({ _id: nameOfListing }, { $set: _newData })
    console.log(`${result.matchedCount} document(s) matched the query criteria.`)
    console.log(`${result.modifiedCount} document(s) was/were updated.`)

    return { update: true }
  } finally {
    // await client.close();
  }
}

const getDevicesList = async id => {
  const collection = database.collection('location')
  const r = await collection.find({ _id: ObjectId(id) }).toArray()
  let deviceList = []
  if (r.length) {
    if (r[0].sensors.length) {
      for (let i = 0; i < r[0].sensors.length; i++) {
        let d = await getDeviceById(r[0].sensors[i])
        if (d) deviceList.push(d)
      }
    }
  }
  return deviceList
}

const getDeviceById = async deviceId => {
  const collection = database.collection('device')
  const r = await collection.find({ _id: new ObjectId(deviceId) }).toArray()
  if (r.length) return r[0]
  else return null
}

module.exports = {
  getUserPasswordByName,
  getLocationByLocationID,
  getDeviceByDeviceID,
  updateRoomTemperature,
  toggleOnOffRoom,
  updateRoomName,
  updateRoomPlan,
  getDevicesList,
  getLocations,
}
