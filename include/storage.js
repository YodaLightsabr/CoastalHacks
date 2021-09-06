const MongoClient = require('mongodb').MongoClient;
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
  allUsers () {
    const client = this.client;
    return new Promise(async (resolve, reject) => {
      var dbo = this.client.db("userdata");
      var data = await dbo.collection('users').find().toArray();
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
}
module.exports = {
  Connection: Connection,
  Storage: Storage,
  User: User
};