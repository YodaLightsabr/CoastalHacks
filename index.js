const express = require('express'); // import express
const fs = require('fs'); // import filesystem
const crypto = require("crypto"); // import cryptography
const cookieParser = require('cookie-parser'); // import http cookie parser
const bootstrap_defs = require('./include/bootstrapdefs.json');

const app = express(); // create an "app" with express
app.use(express.static(__dirname + '/public')); // anything in the /public directory can be accessed with the path

const makeid = () => crypto.randomBytes(10).toString('hex').match(/.{1,4}/g).join('-');

const sessions = {};
const sessionData = {};

app.use(cookieParser());
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => { // when the server has a GET request on the / route
  res.sendFile(__dirname + '/views/index.html'); // serve index.html file
});


app.post('/auth', (req, res) => {
  if (!req.body) return res.status(400).send('Invalid input');
  if (!req.body.uid) return res.status(400).send('Invalid input');
  let id = crypto.randomBytes(40).toString('base64');
  sessions[id] = req.body.uid;
  sessionData[id] = req.body;
  return res.send({ success: true, cookie: id });
});
app.get('/ping', (req, res) => {
  res.send('OK');
});

app.get('/workouts', (req, res) => { // when the server has a GET request on the / route
  res.sendFile(__dirname + '/views/workouts.html'); // serve index.html file
});

app.get('/me', (req, res) => {
  if (req.cookies.__fwf && sessions[req.cookies.__fwf]) {
    res.redirect('/users/' + );
  }
})

app.get('/signin', (req, res) => { // when the server has a GET request on the / route
  if (req.cookies.__fwf && sessions[req.cookies.__fwf]) return res.redirect('/me');
  res.sendFile(__dirname + '/views/signin.html'); // serve index.html file
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

app.listen(8080, () => { // start the server on port 8080 (replit forwards http ports)
  console.log('Webserver running!'); // log to the console once running
});