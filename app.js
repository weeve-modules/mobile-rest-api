const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

app.use(express.json());

const uri =
  "mongodb://wohnio:wohnio@mongodb.wohnio.weeve.engineering:27017/wohnio?authSource=wohnio";

const client = new MongoClient(uri);
const dbname = "wohnio";

// const port = process.env.PORT || 80;
const port = process.env.PORT || 443;

app.post("/checkUser", async (request, res) => {
  connectToClient(client, uri).then(async (response) => {
    getUserPasswordByName(
      client,
      dbname,
      "user",
      request.body.email,
      request.body.password
    ).then(async (response) => {
      res.send(response);
      // await client.close();
    });
  });
});

app.post("/getLocationsUser", async (request, res) => {
  connectToClient(client, uri).then(async (response) => {
    getLocationByLocationID(
      client,
      dbname,
      "location",
      request.body.locationID
    ).then(async (response) => {
      res.send(response);
      // await client.close();
    });
  });
});

app.post("/getDevicesUser", async (request, res) => {
  connectToClient(client, uri).then(async (clientRes) => {
    getDeviceByDeviceID(client, dbname, "device", request.body.deviceID).then(
      async (response) => {
        res.send(response);
        await client.close();
      }
    );
  });
});

app.post("/updateRoomTemperature", async (request, res) => {
  console.log("___ update room temperature ___");
  connectToClient(client, uri).then(async (response) => {
    updateRoomTemperature(
      client,
      dbname,
      "device",
      ObjectId(request.body.idSensor),
      {
        manualTemperature: {
          command: {
            name: "setTemperatur",
            params: {
              value: request.body.temperature,
              until: "1970-01-01T00:00:00.000Z",
            },
          },
        },
      }
    ).then(async (response) => {
      res.send(response);
      await client.close();
    });
  });
});

app.post("/toggleOnOffRoom", async (request, res) => {
  connectToClient(client, uri).then(async (response) => {
    toggleOnOffRoom(client, dbname, "device", ObjectId(request.body.idSensor), {
      isOn: request.body.isOn,
    }).then(async (response) => {
      res.send(response);
      await client.close();
    });
  });
});

app.post("/updateRoomName", async (request, res) => {
  connectToClient(client, uri).then(async (response) => {
    updateRoomName(client, dbname, "device", ObjectId(request.body.idSensor), {
      label: request.body.nameRoom,
    }).then(async (response2) => {
      await client.close();
    });
  });
});

app.post("/updateRoomPlan", async (request, res) => {
  connectToClient(client, uri).then(async (response) => {
    updateRoomPlan(client, dbname, "device", ObjectId(request.body.idSensor), {
      schedule: request.body.scheduleSensor,
    }).then(async (response2) => {
      await client.close();
    });
  });
});

app.listen(port, () => {
  console.clear();
  console.log("******** Server running ********");
});

// Connect to Database
async function connectToClient(client, uri) {
  try {
    await client.connect();
  } catch (e) {
    console.log("Error - " + e);
  } finally {
    // await client.close();
  }
}

// Get Username and Password
async function getUserPasswordByName(
  client,
  dbname,
  collectionname,
  _email,
  _password
) {
  try {
    const database = await client.db(dbname);
    const users = await database.collection(collectionname);

    const cursor = users.find({ email: _email });
    if ((await cursor.count()) === 0) {
      return { nofound: true };
    }

    var currentUser;

    await cursor.forEach((user) => {
      currentUser = user;
    });

    if (currentUser.password != _password) {
      return { falsepassword: true };
    } else {
      return currentUser;
    }
  } finally {
    // await client.close();
  }
}

// Get Location by LocationID
async function getLocationByLocationID(
  client,
  dbname,
  collectionname,
  _locationID
) {
  try {
    const database = await client.db(dbname);
    const locations = await database.collection(collectionname);

    const newobj = {
      _id: ObjectId(_locationID),
    };
    const collection = locations.find(newobj);
    if ((await collection.count()) === 0) {
      return { nofound: true };
    }

    var currentLocation;

    await collection.forEach((location) => {
      currentLocation = location;
    });
    return currentLocation;
  } finally {
    // await client.close();
  }
}

// Get Sensor by SensorID
async function getDeviceByDeviceID(client, dbname, collectionname, _sensorID) {
  try {
    const database = await client.db(dbname);
    const sensors = await database.collection(collectionname);

    const newobj = {
      _id: ObjectId(_sensorID),
    };

    const collection = sensors.findOne(newobj);

    var currentSensor;

    // if ((await collection.count()) === 0) {
    // return { nofound: true };
    // } else {
    currentSensor = collection;
    // console.log(currentSensor);
    // console.log(currentSensor);
    return currentSensor;
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
async function updateRoomTemperature(
  client,
  dbname,
  collectioname,
  nameOfListing,
  _newData
) {
  try {
    const result = await client
      .db(dbname)
      .collection(collectioname)
      .updateOne({ _id: nameOfListing }, { $set: _newData });

    console.log(
      `${result.matchedCount} document(s) matched the query criteria.`
    );
    console.log(`${result.modifiedCount} document(s) was/were updated.`);

    return { update: true };
  } finally {
    // await client.close();
  }
}

// Toggle Room - On / Off
async function toggleOnOffRoom(
  client,
  dbname,
  collectioname,
  nameOfListing,
  _newData
) {
  try {
    const result = await client
      .db(dbname)
      .collection(collectioname)
      .updateOne({ _id: nameOfListing }, { $set: _newData });

    console.log(
      `${result.matchedCount} document(s) matched the query criteria.`
    );
    console.log(`${result.modifiedCount} document(s) was/were updated.`);

    return { update: true };
  } finally {
    // await client.close();
  }
}

// Update Room Name
async function updateRoomName(
  client,
  dbname,
  collectioname,
  nameOfListing,
  _newData
) {
  try {
    const result = await client
      .db(dbname)
      .collection(collectioname)
      .updateOne({ _id: nameOfListing }, { $set: _newData });
    console.log(
      `${result.matchedCount} document(s) matched the query criteria.`
    );
    console.log(`${result.modifiedCount} document(s) was/were updated.`);

    return { update: true };
  } finally {
    // await client.close();
  }
}

// Update Room Plan
async function updateRoomPlan(
  client,
  dbname,
  collectionname,
  nameOfListing,
  _newData
) {
  try {
    const result = await client
      .db(dbname)
      .collection(collectionname)
      .updateOne({ _id: nameOfListing }, { $set: _newData });
    console.log(
      `${result.matchedCount} document(s) matched the query criteria.`
    );
    console.log(`${result.modifiedCount} document(s) was/were updated.`);

    return { update: true };
  } finally {
    // await client.close();
  }
}
