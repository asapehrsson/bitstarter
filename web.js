var express = require('express');
var fs = require('fs');
var path = require("path");

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
    var f =  path.join(__dirname, 'index.html');
    var data = fs.readFileSync(f);
    response.send(data.toString());
});
app.get('*', express.static(__dirname));

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});