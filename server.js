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
var db;
var database;

//CON QUESTO METODO FUNzIONA IL CSS, MA NON IL TASTO LOGIN E NON FUNZIONA IL APP.GET
//app.use(express.static(__dirname));


app.get('/', function(req, res) {

    res.sendFile(path.join(__dirname, '/index.html'));

});


app.get('/offerte', function(req, res) {

    //  res.sendFile(path.join(__dirname, '/offerte.html'));
    db = fs.readFileSync('offerte.json');
    database = JSON.parse(db);
    //console.log(database);

    res.render('offerte.ejs', { data: database });

});






var server = app.listen(port, function() {});
console.log('listen at port ' + port);