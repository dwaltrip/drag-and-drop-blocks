var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);

app.use(express.static(path.join(__dirname, './www')));
app.use('/vendor', express.static(path.join(__dirname, './node_modules')));

var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('listening on:', port);
});
