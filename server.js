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
const { md5 } = require('pg/lib/utils');
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
    var cucina = cookie.parse(req.headers.cookie || '');

    var cookies = cucina.email_profilo_cookie;

    if (cookies) {
        var temp = cookies.split(',');
        var email_cookie = temp[0];
        var profilo_cookie = temp[1];
        console.log("ho ricevuto i cookie...");
        console.log(email_cookie + ' ' + profilo_cookie);

        res.render('index.ejs', { data: database, cookie: email_cookie, profilo: profilo_cookie });

    } else {
        console.log("non ho ricevuto i cookie");
        res.render('index.ejs', { data: database, profilo: '' });
    }
});


app.get('/offerte', function(req, res) {

    var cucina = cookie.parse(req.headers.cookie || '');

    var cookies = cucina.email_profilo_cookie;

    if (cookies) {
        var temp = cookies.split(',');
        var email_cookie = temp[0];
        var profilo_cookie = temp[1];
        console.log("ho ricevuto i cookie...");
        console.log(email_cookie + ' ' + profilo_cookie);

        res.render('offerte.ejs', { data: database, cookie: email_cookie, profilo: profilo_cookie });

    } else {
        console.log("non ho ricevuto i cookie");
        res.render('offerte.ejs', { data: database, profilo: '' });
    }

});

app.get('/offerta', urlencodedParser, function(req, res) {



    console.log('get /offerta');
    res.render('titolo.ejs', { offerta: database[req.query.id] });

});
app.get('/navbar', function(req, res) {
    console.log('get /navbar');
    res.render('navbar.ejs');

});

app.get('/signin', function(req, res) {
    console.log('get /signin');
    res.sendFile(path.join(__dirname, '/sigin.html'));


});

app.get('/profilo', urlencodedParser, function(req, res) {

    console.log('get /profilo');

    var cucina = cookie.parse(req.headers.cookie || '');

    var cookies = cucina.email_profilo_cookie;

    if (cookies) {
        var temp = cookies.split(',');
        var email_cookie = temp[0];
        //  var profilo_cookie = temp[1];
        console.log("ho ricevuto i cookie...");
        //   console.log(email_cookie + ' ' + profilo_cookie);


        client.query('select * from utente where email=\'' + email_cookie + '\'', function(error, result) {
            if (error) { console.log(error); return; }
            var n = String(result.rows[0].nome);
            var c = String(result.rows[0].cognome);
            var s = String(result.rows[0].storico_offerte);
            var p = String(result.rows[0].foto_profilo);
            res.render('profile.ejs', { nome: n, cognome: c, mail: email_cookie, storico: s, profilo: p });

        });
    } else {
        console.log("non ho ricevuto i cookie");
        res.sendFile(path.join(__dirname, '/sigin.html'));
    }





    //res.sendFile(path.join(__dirname, '/profile.html'));


});



app.post('/login', urlencodedParser, function(req, res) {

    console.log('post /login');
    var mail = req.body.mail;
    var password = md5(req.body.password);
    var profilo;
    client.query('select * from utente where email=' + '\'' + mail + '\'' + ' and password=' + '\'' + password + '\'', function(error, result) {

        if (error) { console.log(error); return; }

        console.log("Utente loggato correttamente");
        try {
            profilo = String(result.rows[0].foto_profilo);
            console.log(profilo);
            //res.render('index.ejs', { data: database, profilo: p });

        } catch (error) {
            console.log(error);
            return;
        }

        set_cookie();


    });


    function set_cookie() {
        //qua setto i cookie
        console.log(mail + ' ' + profilo);


        if (mail) {

            console.log("Procedo a settare i cookies: " + mail + ' ' + profilo);


            // Set a new cookie with the name
            res.setHeader('Set-Cookie', cookie.serialize('email_profilo_cookie', [mail, profilo], {
                httpOnly: true,
                maxAge: 60 * 60 // 1 hour
            }));
            /*   res.setHeader('Set-Cookie', cookie.serialize('profile_cookie', profilo, {
                   httpOnly: true,
                   maxAge: 60 * 60 // 1 hour
               }));*/
            // Redirect back after setting cookie
            res.statusCode = 302;
            res.setHeader('Location', req.headers.referer || '/');
            console.log("Cookies settati");
        }

        res.end();
        return;


    };


});

app.get('/logout', function(req, res) {
    console.log('get /logout');

    const p1 = Promise.resolve(res.clearCookie("email_profilo_cookie"));





    p1.then(value => {
        //   res.render('index.ejs', { data: database, profilo: '' });
        res.statusCode = 302;
        res.setHeader('Location', req.headers.referer || '/');
        res.end();
        return;
    });
    //  return;


});

app.post('/signin', urlencodedParser, function(req, res) {

    console.log('post /signin');

    var nome = req.body.firstName;
    var cognome = req.body.lastName;
    var mail = req.body.email;
    var pass = md5(req.body.password);


    client.query('insert into utente(email,password,storico_offerte,foto_profilo,nome,cognome) values (' + '\'' + mail + '\',' + '\'' + pass + '\',' + '\'{}\',' + '\'' + String('https://cdn.calciomercato.com/images/2019-05/Whatsapp.senza.immagine.2019.1400x840.jpg') + '\',' + '\'' + nome + '\',' + '\'' + cognome + '\');', function(error, result) {

        if (error) {

            if (error.code === '23505') {

                res.send("<p>mail gia presa clicca <a href='/'>qui<a> per tornare all'homepage </p> ");
                res.end();

                // res.sendFile(path.join(__dirname, '/sigin.html'));
            } else {
                throw error;
            }
        } else {
            res.send("<p>Registrazione eseguita correttamente, clicca <a href='/'>qui<a> per tornare all'homepage </p> ");
        }

    });

});



var server = app.listen(port, function() {});
console.log('listen at  http://127.0.0.1:' + port);