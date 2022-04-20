var cookie = require('cookie');
var escapeHtml = require('escape-html');
var http = require('http');
var url = require('url');
const { Client } = require('pg');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
const { response } = require('express');
var port = 3334;
app.set('view engine', 'ejs');
app.use(express.static(__dirname));

var database = JSON.parse(fs.readFileSync('offerte.json')); //legge il contenuto di offerte json
var credenziali = JSON.parse(fs.readFileSync('credenziali.json'));
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const client = new Client({
    user: credenziali.user,
    host: credenziali.host,
    database: credenziali.database,
    password: credenziali.password,
    port: credenziali.port,
});

client.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get('/', function(req, res) {
    console.log('get /');
    res.render('index.ejs', { data: database });

});


app.get('/offerte', function(req, res) {
    console.log('get /offerte');
    res.render('offerte.ejs', { data: database });

});

app.get('/offerta', urlencodedParser, function(req, res) {

    console.log('get /offerta');
    res.render('titolo.ejs', { offerta: database[req.query.id] });

});

app.get('/signin', function(req, res) {
    console.log('get /signin');
    res.sendFile(path.join(__dirname, '/sigin.html'));


});

app.post('/login', urlencodedParser, function(req, res) {

    console.log('post /login');
    var mail = req.body.mail;
    var password = req.body.passw;

    ;

    client.query('select * from utente where email=mail and password=password', function(error, result) {

        if (error) { console.log(error); }

        console.log(result);


    });

});

app.post('/signin', urlencodedParser, function(req, res) {

    console.log('post /signin');

    var nome = req.body.firstName;
    var cognome = req.body.lastName;
    var mail = req.body.email;
    var pass = req.body.password;


    client.query('insert into utente(email,password,storico_offerte,foto_profilo,nome,cognome) values (' + '\'' + mail + '\',' + '\'' + pass + '\',' + '\'{}\',' + '\'' + String('https://cdn.calciomercato.com/images/2019-05/Whatsapp.senza.immagine.2019.1400x840.jpg') + '\',' + '\'' + nome + '\',' + '\'' + cognome + '\');', function(error, result) {

        if (error) {

            if (error.code === '23505') {


                res.sendFile(path.join(__dirname, '/sigin.html'));



            } else {
                throw error;
            }
        }

    });

    res.render('index.ejs', { data: database });


});








var server = app.listen(port, function() {});
console.log('listen at port ' + port);