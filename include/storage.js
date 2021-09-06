const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.MONGO;

class Storage {
  constructor () {
    //
  }
}
class User extends Storage {
  constructor (id, connection, data) {
    super();
    this.client = connection;
    this.id = id;
    this.data = data;
  }
  fetch () {
    return new Promise((resolve, reject) => {
      var dbo = client.db("userdata");
      var query = { uid: this.id };
      dbo.collection("users").find(query).toArray(function(err, result) {
        if (err) return reject(err);
        resolve(new User(this.id, this.client, result[0]));
      });
    });
  }
  update (data) {
    return new Promise(async (resolve, reject) => {
      var dbo = this.client.db("userdata");
      var myquery = { uid: this.id };
      var newvalues = { $set: data };
      dbo.collection("users").updateOne(myquery, newvalues, async function(err, res) {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }
}
class Workout extends Storage {
  constructor (id, connection, data) {
    super();
    this.id = id;
    this.client = connection;
    this.data = data;
  }
  fetch () {
    return new Promise((resolve, reject) => {
      var dbo = client.db("userdata");
      var query = { _id: ObjectId(this.id) };
      dbo.collection("workouts").find(query).toArray(function(err, result) {
        if (err) return reject(err);
        resolve(new Workout(this.id, this.client, result[0]));
      });
    });
  }
  update (data) {
    return new Promise(async (resolve, reject) => {
      var dbo = this.client.db("userdata");
      var myquery = { _id: ObjectId(this.id) };
      var newvalues = { $set: data };
      dbo.collection("workouts").updateOne(myquery, newvalues, async function(err, res) {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }
}
class Connection {
  constructor () {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client = client;
  }
  connect () {
    return new Promise((resolve, reject) => {
      this.client.connect(err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  close () {
    this.client.close();
  }
  getUser (id) {
    const client = this.client;
    return new Promise((resolve, reject) => {
      var dbo = this.client.db("userdata");
      var query = { uid: id };
      dbo.collection("users").find(query).toArray(function(err, result) {
        if (err) return reject(err);
        if (result.length == 0) {
          resolve(null);
        } else {
          resolve(new User(id, client, result[0]));
        }
      });
    });
  }
  getWorkout (id) {
    const client = this.client;
    return new Promise((resolve, reject) => {
      var dbo = this.client.db("userdata");
      var query = { _id: ObjectId(id) };
      dbo.collection("workouts").find(query).toArray(function(err, result) {
        if (err) return reject(err);
        if (result.length == 0) {
          resolve(null);
        } else {
          resolve(new Workout(id, client, result[0]));
        }
      });
    });
  }
  allUsers () {
    const client = this.client;
    return new Promise(async (resolve, reject) => {
      var dbo = this.client.db("userdata");
      var data = await dbo.collection('users').find().toArray();
      resolve(data);
    });
  }
  allWorkouts (startAt, limit, author) {
    const client = this.client;
    return new Promise(async (resolve, reject) => {
      var dbo = this.client.db("userdata");
      let query = {};
      if (author) {
        query = {
          author: author
        };
      }
      var data = await dbo.collection('workouts').find(query).limit(limit || 20).skip(startAt || 0).toArray();
      resolve(data);
    });
  }
  createUser (id, data) {
    const client = this.client;
    return new Promise((resolve, reject) => {
      var dbo = this.client.db("userdata");
      data.uid = id;
      dbo.collection("users").insertOne(data, function(err, res) {
        if (err) return reject(err);
        resolve(new User(id, client, data));
      });
    });
  }
  createWorkout (data) {
    const client = this.client;
    return new Promise((resolve, reject) => {
      var dbo = this.client.db("userdata");
      dbo.collection("workouts").insertOne(data, function(err, res) {
        if (err) return reject(err);
        resolve(new Workout(res.insertedId.toString(), client, data));
      });
    });
  }
}
module.exports = {
  Connection: Connection,
  Storage: Storage,
  User: User,
  Workout: Workout
};