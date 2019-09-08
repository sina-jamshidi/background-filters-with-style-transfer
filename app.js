const http = require('http');
const express = require('express');
var path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.get('/', function (req, res) {
  res.render('index');
});

app.listen(3000, function () {
  console.log('Server running on port 3000!')
});