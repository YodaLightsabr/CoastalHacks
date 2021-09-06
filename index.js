const admin = require('firebase-admin');
const express = require('express'); // import express
const fs = require('fs'); // import filesystem
const crypto = require("crypto"); // import cryptography
const cookieParser = require('cookie-parser'); // import http cookie parser
const bootstrap_defs = require('./include/bootstrapdefs.json');
const storage = require('./include/storage');
const db = new storage.Connection();
db.connect().then(database => {
  console.log('Database connected');
});
const he = require('he');

const serviceAccount = require("./fit-with-friends-costalhacks-firebase-adminsdk-ufr42-686506818e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express(); // create an "app" with express
app.use(express.static(__dirname + '/public')); // anything in the /public directory can be accessed with the path


const makeid = () => crypto.randomBytes(10).toString('hex').match(/.{1,4}/g).join('-');

const sessions = {};
const sessionData = {};

app.use(cookieParser());
app.use((req, res, next) => {
  res.sendAuthedFile = (filepath, variables, base) => {
    if (!variables) variables = {};
    let data = fs.readFileSync(filepath, 'utf8');
    let authed = req.cookies.__fwf && sessions[req.cookies.__fwf];
    let unauth = data.match(/\{\{unauthed\}\}(.|\n)*?\{\{\/unauthed\}\}/g);
    if (unauth !== null) unauth.forEach(item => {
      if (authed) {
        data = data.replace(item, '')
      } else {
        data = data.replace(item, item.substring(12, item.length - 13));
      }
    });
    let auth = data.match(/\{\{authed\}\}(.|\n)*?\{\{\/authed\}\}/g);
    if (auth !== null) auth.forEach(item => {
      if (!authed) {
        data = data.replace(item, '')
      } else {
        data = data.replace(item, item.substring(10, item.length - 11));
      }
    });
    let cleanvars = data.match(/\{\{:.*?\}\}/g);
    if (cleanvars !== null) cleanvars.forEach(item => {
      let varname = item.substring(3, item.length - 2);
      data = data.replace(item, (variables[varname] || base || 'null').split('').filter(char => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-='.split('').includes(char)).join(''));
    });
    let xssvars = data.match(/\{\{;.*?\}\}/g);
    if (xssvars !== null) xssvars.forEach(item => {
      let varname = item.substring(3, item.length - 2);
      data = data.replace(item, he.encode(variables[varname] || base || 'null'));
    });
    res.send(data);
  }
  next();
});
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => { // when the server has a GET request on the / route
  res.sendAuthedFile(__dirname + '/views/index.html'); // serve index.html file
});;
app.get('/create', (req, res) => { // when the server has a GET request on the / route
  res.sendAuthedFile(__dirname + '/views/editor.html'); // serve index.html file
});
app.post('/create', async (req, res) => {
  if (!req.cookies.__fwf || !sessions[req.cookies.__fwf]) return res.redirect('/signin');
  let workout = await db.createWorkout({
    title: req.body.title,
    type: req.body.type,
    description: req.body.description,
    liked_users: [],
    steps: req.body.steps.split('\n'),
    time: Date.now(),
    author: sessions[req.cookies.__fwf]
  });
  res.redirect('/workouts');
});
app.get('/users/:id', async (req, res, next) => { // when the server has a GET request on the / route
  let user = await db.getUser(req.params.id);
  if (user == null) return next();
  let firebaseUser;
  try {
    firebaseUser = await admin
      .auth()
      .getUser(req.params.id);
  } catch (e) {
    return next();
  }
  res.sendAuthedFile(__dirname + '/views/profile2.html', {
    id: req.params.id,
    username: user.data.username || '!NoUsernameSet',
    bio: user.data.bio || 'No bio set.',
    workout_number: user.data.workouts.length + '',
    avatar: firebaseUser.photoURL || 'https://i.pinimg.com/originals/60/99/f3/6099f305983371dadaceae99f5c905bf.png',
    active: req.params.id == sessions[req.cookies.__fwf] ? ' active' : ''
  }); // serve index.html file
});

app.post('/auth', async (req, res) => {
  if (!req.body) return res.status(400).send('Invalid input');
  if (!req.body.idtoken) return res.status(400).send('Invalid input');
  let id = crypto.randomBytes(40).toString('base64');
  let decodedtoken;
  try {
    decodedtoken = await admin
      .auth()
      .verifyIdToken(req.body.idtoken);
  } catch (err) {
    return res.send({ success: false, error: 'Invalid ID token.' });
  }
  let { uid } = decodedtoken;
  sessions[id] = uid;
  sessionData[id] = req.body;
  return res.send({ success: true, cookie: id });
});
app.get('/ping', (req, res) => {
  res.send('OK');
});
app.get('/quit', (req, res) => {
  if (sessions[req.cookies.__fwf]) delete sessions[req.cookies.__fwf];
  res.redirect('/');
});

app.get('/workouts', (req, res) => { // when the server has a GET request on the / route
  res.sendAuthedFile(__dirname + '/views/workouts.html'); // serve index.html file
});
app.get('/workouts/:id', (req, res) => { // when the server has a GET request on the / route
  res.sendAuthedFile(__dirname + '/views/workout.html', {
    bio: 'bio',
    desc: 'desc'
  }); // serve index.html file
});
app.get('/splash', (req, res) => { // when the server has a GET request on the / route
  res.sendAuthedFile(__dirname + '/views/splash.html'); // serve index.html file
});

app.get('/me', (req, res) => {
  if (req.cookies.__fwf && sessions[req.cookies.__fwf]) {
    res.redirect('/users/' + sessions[req.cookies.__fwf]);
  } else {
    res.redirect('/signin');
  }
});

app.get('/signin', (req, res) => { // when the server has a GET request on the / route
  if (req.cookies.__fwf && sessions[req.cookies.__fwf]) return res.redirect('/me');
  res.sendAuthedFile(__dirname + '/views/signin.html'); // serve index.html file
});

app.get('/api/v1/bootstrap', (req, res) => {
  let bootstrap = fs.readFileSync(__dirname + '/public/bootstrap.css', 'utf8');
  for (const color in bootstrap_defs.colors) {
    if (req.query[color]) {
      let colors = bootstrap_defs.colors[color];
      let originals = Object.keys(colors);
      let replacers = req.query[color].split(',');
      for (var i = 0; i < originals.length; i++) {
        colors[originals[i]].forEach(item => {
          bootstrap = bootstrap.split(item).join('#' + replacers[i]);
        });
      } 
    }
  }
  for (const toReplace in bootstrap_defs.replace) {
    bootstrap = bootstrap.split(toReplace).join(bootstrap_defs.replace[toReplace]);
  }
  res.setHeader('Content-Type', 'text/css');
  res.send(bootstrap);
});

app.get('/api/v1/workouts', async (req, res) => {
  try {
    let workouts = await db.allWorkouts(parseInt(req.query.start), parseInt(req.query.limit), req.query.author);
    for (var i = 0; i < workouts.length; i++) {
      let workout = workouts[i];
      let id = workout.author;
      let user;
      let dbUser;
      try {
        user = await admin
          .auth()
          .getUser(id);
        console.log(user);
        workout.author = {};
        workout.author.id = id;
        workout.author.avatar = user.photoURL || 'https://i.pinimg.com/originals/60/99/f3/6099f305983371dadaceae99f5c905bf.png';
      } catch (err) {
        workout.author = {};
        workout.author.id = id;
        workout.author.avatar = 'https://i.pinimg.com/originals/60/99/f3/6099f305983371dadaceae99f5c905bf.png';
      }
      try {
        dbUser = await db.getUser(id);
        if (dbUser !== null) {
          workout.author.username = dbUser.data.username;
        } else {
          workout.author.username = id;
        }
      } catch (err) {
        workout.author.username = id;
      }
      workouts[i] = workout;
    }
    res.send(workouts);
  } catch (err) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.listen(8080, () => { // start the server on port 8080 (replit forwards http ports)
  console.log('Webserver running!'); // log to the console once running
});