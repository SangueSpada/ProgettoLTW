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
const { Console } = require('console');
const { redirect } = require('express/lib/response');
var port = 3334;
app.set('view engine', 'ejs');
app.use(express.static(__dirname)); //per elaborare il css
var utils = require('./utils');

var database = JSON.parse(fs.readFileSync('hotels.json')); //legge il contenuto di offerte json
var credenziali = JSON.parse(fs.readFileSync('credenziali.json'));
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// metodo per avere un array di date fra due date

//fine metodo ausiliari

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
    var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
    var cities = new Set();
    database.forEach(item => { cities.add(item.citta); });

    if (cookies) {
        let cook = utils.getCookies(cookies);
        var email_cookie = cook[0];
        var profilo_cookie = cook[1];

        res.render('index.ejs', { data: database, cittas: cities, cookie: email_cookie, profilo: profilo_cookie });

    } else {
        console.log("non ho ricevuto i cookie");
        res.render('index.ejs', { data: database, cittas: cities, profilo: '' });
    }
});

app.post('/ricerca', urlencodedParser, function(req, res) {

    console.log('post /ricerca');

    var checkin = req.body.CheckIn;
    var checkout = req.body.CheckOut;
    var luogo = req.body.testo_ricerca;
    var persone = req.body.partecipants;
    ricerca = [luogo, checkin, checkout, persone];
    var resp;
    var minidb = new Set();
    var rangeDate = utils.getDates(checkin, checkout);
    console.log(rangeDate);
    var cities = new Set();
    database.forEach(item => { cities.add(item.citta); });

    if (luogo == '') {
        console.log("luogo non inserito");
        database.forEach(item => { minidb.add(item); }); //aggiungo tutti gli hotel a miniDb
        let queryHotel = 'with somma as (select hotel_id,data_pernotto,partecipanti from prenotazioni) select somma.hotel_id,somma.data_pernotto, sum(somma.partecipanti) as prenotati from somma group by (somma.hotel_id,somma.data_pernotto) order by (somma.hotel_id,somma.data_pernotto)';
        const p1 = new Promise((resolve, reject) => {
            client.query(queryHotel, function(error, result) {
                if (error) {
                    console.log(error);
                    return [];
                }
                resolve(QueryResult = result);
            })
        });
        p1.then(value => {
            utils.totalAvilability(QueryResult, minidb, rangeDate, persone); //leva gli hotel da miniDb che non sono disponibili in rangeDate a persone

            var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
            if (cookies) {
                let cook = utils.getCookies(cookies);
                var email_cookie = cook[0];
                var profilo_cookie = cook[1];


                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, cookie: email_cookie, profilo: profilo_cookie, query: ricerca });

            } else {
                console.log("non ho ricevuto i cookie");
                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, profilo: '', query: ricerca });
            }
        });
    } else if (cities.has(luogo)) {
        console.log("luogo = citta = " + luogo);
        database.forEach(item => {
            if (item.citta == luogo) {
                minidb.add(item);
            }
        });
        let queryHotel = 'with somma as (select hotel_id,data_pernotto,partecipanti from prenotazioni) select somma.hotel_id,somma.data_pernotto, sum(somma.partecipanti) as prenotati from somma group by (somma.hotel_id,somma.data_pernotto) order by (somma.hotel_id,somma.data_pernotto)';
        const p1 = new Promise((resolve, reject) => {
            client.query(queryHotel, function(error, result) {
                if (error) {
                    console.log(error);
                    return [];
                }
                resolve(QueryResult = result);
            })
        });
        p1.then(value => {
            utils.placeAvilability(luogo, QueryResult, minidb, rangeDate, persone, database);

            var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
            if (cookies) {
                let cook = utils.getCookies(cookies);
                var email_cookie = cook[0];
                var profilo_cookie = cook[1];


                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, cookie: email_cookie, profilo: profilo_cookie, query: ricerca });

            } else {
                console.log("non ho ricevuto i cookie");
                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, profilo: '', query: ricerca });
            }
        });
    } else {
        console.log("luogo = hotel = " + luogo);
        var hotel;
        //console.log(Object.keys(database).length);
        for (var i = 0; i < (Object.keys(database).length); i++) {
            if (String(database[i].titolo) == String(luogo)) {
                hotel = database[i];
                break;
            }
        }
        let queryHotel = 'with somma as (select hotel_id,data_pernotto,partecipanti from prenotazioni where hotel_id=\'' + hotel.id + '\') select somma.hotel_id,somma.data_pernotto, sum(somma.partecipanti) as prenotati from somma group by (somma.hotel_id,somma.data_pernotto) order by (somma.hotel_id,somma.data_pernotto)';
        var QueryResult;
        const p1 = new Promise((resolve, reject) => {
            client.query(queryHotel, function(error, result) {
                if (error) {
                    console.log(error);
                    return [];
                }
                resolve(QueryResult = result);
            })
        });
        p1.then(value => {
            resp = utils.hotelAvilability(hotel, QueryResult, minidb, rangeDate, persone);

            var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
            if (cookies) {
                let cook = utils.getCookies(cookies);
                var email_cookie = cook[0];
                var profilo_cookie = cook[1];

                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, cookie: email_cookie, profilo: profilo_cookie, query: ricerca, res: resp });

            } else {
                console.log("non ho ricevuto i cookie");
                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, profilo: '', query: ricerca, res: resp });
            }
        });
    }
});

app.post('/prenota', urlencodedParser, function(req, res) {
    console.log('post /prenota');

    var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
    let cook = utils.getCookies(cookies);
    var email_cookie = cook[0];
    var profilo_cookie = cook[1];

    var checkin = req.body.CheckIn;
    var checkout = req.body.CheckOut;
    var luogo = req.body.testo_ricerca;
    var persone = req.body.partecipants;
    var prezzo = req.body.prezzo_finale;
    ricerca = [luogo, checkin, checkout, persone, prezzo];
    var minidb = new Set();
    var rangeDate = utils.getDates(checkin, checkout);
    var hotel;
    var resp;

    for (var i = 0; i < (Object.keys(database).length); i++) { //trova l'hotel dal titolo
        if (String(database[i].titolo) == String(luogo)) {
            hotel = database[i]
            break;
        }
    }
    let queryHotel = 'with somma as (select hotel_id,data_pernotto,partecipanti from prenotazioni where hotel_id=\'' + hotel.id + '\') select somma.hotel_id,somma.data_pernotto, sum(somma.partecipanti) as prenotati from somma group by (somma.hotel_id,somma.data_pernotto) order by (somma.hotel_id,somma.data_pernotto)';
    var QueryResult;
    const p1 = new Promise((resolve, reject) => {
        client.query(queryHotel, function(error, result) {
            if (error) {
                console.log(error);
                return [];
            }
            resolve(QueryResult = result);
        })
    });
    p1.then(value => {
        resp = utils.hotelAvilability(hotel, QueryResult, minidb, rangeDate, persone);
        //console.log(minidb);
        if (minidb.size > 0) { //se l hotel è disponibile procede
            let id_booking;
            const p2 = new Promise((resolve, reject) => {
                client.query('select max(id_booking) as max_id from prenotazioni', function(error, result) {
                    if (error) {
                        console.log(error);
                        return [];
                    }
                    if (parseInt(result.rows[0].max_id) > 0) { id_booking = parseInt(result.rows[0].max_id) + 1; } else { id_booking = 1; }
                    resolve(id_booking != undefined);
                });
            });

            p2.then(value => {
                var timestamp = new Date().toISOString();
                var flag = false;
                rangeDate.forEach(giorno_pern => {
                    client.query('insert into prenotazioni values (' + '\'' + email_cookie + '\',' + '\'' + id_booking + '\',' + '\'' + hotel.id + '\',' + '\'' + persone + '\',' + '\'' + giorno_pern + '\',' + '\'' + timestamp + '\');', function(error, result) {
                        if (error) {
                            flag = true;
                            console.log(error);
                        }
                    })
                    id_booking++;
                });
                if (flag) { //la prenotazione è avvenuta in modo parziale o nulla
                    res.render('titolo.ejs', { offerta: database[hotel.id], profilo: profilo_cookie, search: ricerca });
                } else {
                    console.log("Prenotazione registrata correttamente nel sistema!");
                    res.redirect('/profilo');
                }
                res.end();
                return;
            });

        } else { //altrimenti rimanda la ricerca (da ampliare con gli errori eventuali)
            console.log("hotel non disponibile in quelle date");
            res.render('titolo.ejs', { offerta: database[hotel.id], profilo: profilo_cookie, search: ricerca, res: resp });
        }
    });


});

app.get('/offerte', function(req, res) {
    var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
    if (cookies) {
        let cook = utils.getCookies(cookies);
        var email_cookie = cook[0];
        var profilo_cookie = cook[1];
        res.render('offerte.ejs', { data: database, cookie: email_cookie, profilo: profilo_cookie });
    } else {
        console.log("non ho ricevuto i cookie");
        res.render('offerte.ejs', { data: database, profilo: '' });
    }
});

app.get('/offerta', urlencodedParser, function(req, res) {
    console.log('get /offerta');

    var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
    if (cookies) {
        let cook = utils.getCookies(cookies);
        var email_cookie = cook[0];
        var profilo_cookie = cook[1];
        res.render('titolo.ejs', { offerta: database[req.query.id], cookie: email_cookie, profilo: profilo_cookie, search: '', res: '' });

    } else {
        console.log("non ho ricevuto i cookie");
        res.render('titolo.ejs', { offerta: database[req.query.id], profilo: '', search: '', res: '' });
    }
});

app.post('/cancella', function(req, res) {
    console.log("post /cancella");

    var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
    let cook = utils.getCookies(cookies);
    var email_cookie = cook[0];

    var timestamp = req.query.timestamp;
    let queryHotel = 'delete from prenotazioni where user_email=\'' + email_cookie + '\' and timestamp =\'' + timestamp + '\'';
    var QueryResult;
    const p1 = new Promise((resolve, reject) => {
        client.query(queryHotel, function(error, result) {
            if (error) {
                console.log(error);
                return [];
            }
            resolve(QueryResult = result);
        })
    });
    p1.then(value => {
        console.log("Prenotazione cancellata correttamente nel sistema!");
        res.redirect('/profilo');

    });
});


/* +++++++++++++++++++++++ GESTIONE LOGIN SIGIN LOGOUT ++++++++++++++++++++++++++++ */




app.post('/login', urlencodedParser, function(req, res) {
    console.log('post /login');
    var mail = req.body.mail;
    var password = md5(req.body.password);
    var profilo;
    client.query('select * from utente where email=' + '\'' + mail + '\'', function(error, result) {
        if (error) {
            console.log(error);
            return;
        } else if (result.rows[0] == undefined) {

            res.status(401).send("<p>L'email inserita non è registrata nel sistema o non è stata scritta correttamente. Clicca <a href='/'>qui<a> per tornare all'homepage </p> ");
            return;
        } else {
            client.query('select * from utente where email=' + '\'' + mail + '\'' + ' and password=' + '\'' + password + '\'', function(error, result) {
                if (error) {
                    console.log(error);
                    return;
                } else if (result.rows[0] == undefined) {
                    res.status(401).send("<p>Password sbagliata. Clicca <a href='/'>qui<a> per tornare all'homepage </p> ");
                    return;
                } else {
                    profilo = result.rows[0].foto_profilo;
                    console.log("Utente loggato correttamente");
                    set_cookie();

                }
            })
        }
    })

    function set_cookie() {
        //qua setto i cookie
        console.log(mail + ' ' + profilo);
        if (mail) {
            console.log("Procedo a settare i cookies: " + mail + ' ' + profilo);
            // Set a new cookie with the name
            res.setHeader('Set-Cookie', cookie.serialize('email_profilo_cookie', [mail, profilo], {
                httpOnly: true,
                maxAge: 60 * 60, // 1 hour
                path: '/'
            }));
            console.log("Cookies settati");
        }

        //  res.redirect('/');
        //    res.status(204).send();
        res.status(200).send(profilo);
        res.end();
        return;
    };
});


app.get('/logout', function(req, res) {
    console.log('get /logout');
    const p1 = Promise.resolve(res.status(200).clearCookie("email_profilo_cookie"));
    p1.then(value => {
        //   res.render('index.ejs', { data: database, profilo: '' });
        //  res.redirect('/');
        res.end();
        return;
    });
});

app.post('/signin', urlencodedParser, function(req, res) {

    console.log('post /signin');
    var nome = req.body.firstName;
    var cognome = req.body.lastName;
    var mail = req.body.email;
    var pass = md5(req.body.password);
    var indirizzo = req.body.address;
    var sesso = req.body.sesso;
    console.log(nome + ' ' + cognome + ' ' + mail + ' ' + indirizzo + ' ' + sesso);

    client.query('insert into utente(email,password,foto_profilo,nome,cognome,indirizzo,sesso) values (' + '\'' + mail + '\',' + '\'' + pass + '\',' + '\'' + String('https://cdn.calciomercato.com/images/2019-05/Whatsapp.senza.immagine.2019.1400x840.jpg') + '\',' + '\'' + nome + '\',' + '\'' + cognome + '\',' + '\'' + indirizzo + '\',' + '\'' + sesso + '\');', function(error, result) {

        if (error) {
            if (error.code === '23505') {
                res.send("<p>mail gia presa clicca <a href='/sigin'>qui<a> per tornare alla sigin </p> ");
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

app.get('/signin', function(req, res) {
    var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
    if (cookies) {
        res.redirect('/');
    } else {
        console.log('get /signin');
        res.sendFile(path.join(__dirname, '/sigin.html'));
    }
});

app.get('/profilo', urlencodedParser, function(req, res) {

    console.log('get /profilo');

    var cookies = cookie.parse(req.headers.cookie || '').email_profilo_cookie;
    if (cookies) {
        let cook = utils.getCookies(cookies);
        var email_cookie = cook[0];
        var profilo_cookie = cook[1];

        var dati_profilo = [];
        var dati_prenotazioni = new Set();

        client.query('select * from utente left join prenotazioni on email=user_email where email=\'' + email_cookie + '\'', function(error, result) {
            if (error) {
                console.log(error);
                return;
            }
            let row = result.rows[0]
            dati_profilo = [row.nome, row.cognome, row.foto_profilo, row.indirizzo, row.sesso];

            client.query('with range as (select timestamp, hotel_id, partecipanti, min(data_pernotto) as checkin, max(data_pernotto) as checkout from prenotazioni where user_email=\'' + email_cookie + '\' group by (timestamp, hotel_id, partecipanti)  )  select * from range', function(error, result) {
                if (error) {
                    console.log(error);
                    return;
                }
                result.rows.forEach(tupla => {
                    let titolo = database[tupla.hotel_id].titolo;
                    let immagine = database[tupla.hotel_id].immagine;
                    let checkin = tupla.checkin;
                    let checkout = tupla.checkout;
                    let partecipanti = tupla.partecipanti;
                    let Cin = new Date(checkin);
                    let Cout = new Date(checkout);
                    let giorni = (Cout.getTime() - Cin.getTime()) / (1000 * 3600 * 24);
                    let prezzo = parseInt(database[tupla.hotel_id].prezzo) * giorni * parseInt(partecipanti);
                    let timestamp = tupla.timestamp;
                    console.log(timestamp);
                    let prenotazione = [immagine, titolo, Cin.toISOString().split('T')[0], Cout.toISOString().split('T')[0], partecipanti, prezzo, timestamp];
                    dati_prenotazioni.add(prenotazione);
                });
                res.render('profile.ejs', { d_profilo: dati_profilo, dati_book: dati_prenotazioni, mail: email_cookie, profilo: profilo_cookie });
            });
        });
    } else {
        console.log("non ho ricevuto i cookie");
        res.redirect('/signin');
    }
});

var port = process.env.PORT || 3334;
var server = app.listen(port);
console.log('listen at  http://127.0.0.1:' + port);