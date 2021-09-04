const express = require('express'); // import express

const app = express(); // create an "app" with express
app.use(express.static(__dirname + '/public')); // anything in the /public directory can be accessed with the path

app.get('/', (req, res) => { // when the server has a GET request on the / route
  res.sendFile(__dirname + '/views/index.html'); // serve index.html file
});

app.listen(8080, () => { // start the server on port 8080 (replit forwards http ports)
  console.log('Webserver running!'); // log to the console once running
});