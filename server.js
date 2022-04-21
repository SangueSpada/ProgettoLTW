var cookie = require('cookie');
//var escapeHtml = require('escape-html');
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
app.use(express.static(__dirname)); //per elaborare il css

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
    var cookies = cookie.parse(req.headers.cookie || '');
    var email_cookie = cookies.email_cookie;
    //    console.log(String(req.body));



    if (email_cookie) {

    } else {}






    res.render('index.ejs', { data: database });

});


app.get('/offerte', function(req, res) {

    var cookies = cookie.parse(req.headers.cookie || '');

    var email_cookie = cookies.email_cookie;


    if (email_cookie) {} else {}


    console.log('get /offerte');
    res.render('offerte.ejs', { data: database });

});

app.get('/offerta', urlencodedParser, function(req, res) {

    var cookies = cookie.parse(req.headers.cookie || '');

    var email_cookie = cookies.email_cookie;

    if (email_cookie) {} else {}

    console.log('get /offerta');
    res.render('titolo.ejs', { offerta: database[req.query.id] });

});
app.get('/navbar',function(req, res) {
    console.log('get /navbar');
    res.render('navbar.ejs');

});

app.get('/signin', function(req, res) {
    console.log('get /signin');
    res.sendFile(path.join(__dirname, '/sigin.html'));


});

app.get('/profilo', urlencodedParser, function(req, res) {

    console.log('get /profilo');

    var cookies = cookie.parse(req.headers.cookie || '');

    var email_cookie = cookies.email_cookie;

    if (email_cookie) {

        var n;
        var c;
        var s;
        var p;


        client.query('select * from utente where email=\'' + email_cookie + '\'', function(error, result) {
            if (error) { console.log(error); return; }
            n = String(result.rows[0].nome);
            c = String(result.rows[0].cognome);
            s = String(result.rows[0].storico_offerte);
            p = String(result.rows[0].foto_profilo);
            res.render('profile.ejs', { nome: n, cognome: c, mail: email_cookie, storico: s, profilo: p });

        });

    } else { res.sendFile(path.join(__dirname, '/sigin.html')); }

    //res.sendFile(path.join(__dirname, '/profile.html'));


});



app.post('/login', urlencodedParser, function(req, res) {

    console.log('post /login');
    var mail = req.body.mail;
    var password = req.body.password;

    client.query('select * from utente where email=' + '\'' + mail + '\'' + ' and password=' + '\'' + password + '\'', function(error, result) {


        if (error) { console.log(error); return; }
        //  console.log(result);
        // console.log(result.rows[0].nome + result.rows[0].storico_offerte + result.rows[0].foto_profilo + result.rows[0].cognome);

    });





    //qua setto i cookie
    //var query = url.parse(req.url, true, true).query;
    var email_cookie;
    //    console.log(String(req.body));
    try {

        email_cookie = req.body.email_cookie;

    } catch (error) {}

    if (!email_cookie) {

        // Set a new cookie with the name
        res.setHeader('Set-Cookie', cookie.serialize('email_cookie', mail, {
            httpOnly: true,
            maxAge: 60 * 60 // 1 hour
        }));

        // Redirect back after setting cookie
        res.statusCode = 302;
        res.setHeader('Location', req.headers.referer || '/');

        res.end();

        return;
    }



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
                

                res.send('<p>mail gia presa </p> ');
                res.end();


                // res.sendFile(path.join(__dirname, '/sigin.html'));



            } else {
                throw error;
            }
        }

    });

    res.render('index.ejs', { data: database });


});








var server = app.listen(port, function() {});
console.log('listen at  http://127.0.0.1:' + port);