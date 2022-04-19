var cookie = require('cookie');
var escapeHtml = require('escape-html');
var http = require('http');
var url = require('url');
//var math = require("mathjs");
var express = require('express');
var app = express();
//var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var port = 3334;
app.set('view engine', 'ejs');
app.use(express.static(__dirname));

var database=JSON.parse(fs.readFileSync('offerte.json')); //legge il contenuto di offerte json

//  res.sendFile(path.join(__dirname, '/offerte.html')); per la visualizzazione statica

app.get('/', function(req, res) {
    console.log('get /');
    res.render('index.ejs', { data: database });

});


app.get('/offerte', function(req, res) {
    console.log('get /offerte');
    res.render('offerte.ejs', { data: database });

});

app.get('/titolo', function(req, res) {
    console.log('get /titolo');
      res.render('offerte.ejs', { data: database });

});







var server = app.listen(port, function() {});
console.log('listen at port ' + port);