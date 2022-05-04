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

var database = JSON.parse(fs.readFileSync('hotels.json')); //legge il contenuto di offerte json
var credenziali = JSON.parse(fs.readFileSync('credenziali.json'));
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// metodo per avere un array di date fra due date
function getDates(start, end) {
    for (var arr = [], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        arr.push(new Date(dt).toISOString().split('T')[0]);
    }
    return arr;
}


function totalAvilability(result, minidb, rangeDate, persone) { //esplora  caso migliore=caso peggiore in o(2n)
    console.log(minidb);
    for (let item of minidb) { // verifica se ci sono hotel con posti letto < persone
        if (parseInt(persone) > parseInt(item.disponibilita)) {
            minidb.delete(item);
            console.log("L'hotel " + item.id + " ha disponibilità minore dei partecipanti richiesti");
            console.log(persone + ' ' + item.disponibilita);
        }
    }

    for (var i = 0; i < result.rows.length; i++) {
        let idAlbergo = result.rows[i].hotel_id;
        let j = i;
        while (j < result.rows.length && idAlbergo == result.rows[j].hotel_id) { // hotel[i] == hotel[j]
            if (rangeDate.includes(result.rows[j].data_pernotto.toISOString().split('T')[0]) && parseInt(result.rows[j].prenotati) + parseInt(persone) > parseInt(database[idAlbergo].disponibilita)) {
                minidb.forEach(function(point) {
                    if (point.id == idAlbergo) {
                        minidb.delete(point)
                    }
                });
            }
            j++;
        }
        i = j;
    }

}

function placeAvilability(citta, result, minidb, rangeDate, persone) { //esplora tutto nel caso peggiore in o(n)

    for (let item of minidb) { // verifica se ci sono hotel con posti letto < persone
        if (parseInt(persone) > parseInt(item.disponibilita)) {
            minidb.delete(item);
            console.log("L'hotel " + item.id + " ha disponibilità minore dei partecipanti richiesti");
            console.log(persone + ' ' + item.disponibilita);
        }
    }

    for (var i = 0; i < result.rows.length; i++) { //per ogni hotel della query 
        let idAlbergo = result.rows[i].hotel_id;
        if (database[idAlbergo].citta != citta) { //se l albergo non è nella citta richiesta continua a scorrere
            console.log("aoao");
            continue;
        } else {
            let j = i;
            while (j < result.rows.length && idAlbergo == result.rows[j].hotel_id) { // hotel[i] == hotel[j]
                if (rangeDate.includes(result.rows[j].data_pernotto.toISOString().split('T')[0]) && parseInt(result.rows[j].prenotati) + parseInt(persone) > parseInt(database[idAlbergo].disponibilita)) {
                    minidb.forEach(function(point) {
                        if (point.id == idAlbergo) {
                            minidb.delete(point)
                        }
                    });
                }
                j++;
            }
            i = j;
        }
    }
    console.log(minidb);
}

function hotelAvilability(hotel, result, minidb, rangeDate, persone) { //caso peggiore o(n)
    let hotels_prenotati = [];
    for (var k = 0; k < result.rows.length; k++) { //inserisce in una lista gli id degli hotel
        hotels_prenotati.push(result.rows[k].hotel_id);
    }

    if (parseInt(persone) > parseInt(hotel.disponibilita)) { //caso migliore o(1)
        console.log("L'hotel " + hotel.id + " ha disponibilità minore dei partecipanti richiesti");

    } else {
        if (!(hotels_prenotati.includes(hotel.id))) { //verifica o(n)
            minidb.add(hotel);
            console.log("L'hotel " + hotel.id + " è disponibile");
            return;
        } else {
            for (var j = 0; j < result.rows.length; j++) { //scorre la lista finchè non trova l'hotel e controlla le altre condizioni
                if (String(result.rows[j].hotel_id) == String(hotel.id) && rangeDate.includes(result.rows[j].data_pernotto.toISOString().split('T')[0]) && parseInt(result.rows[j].prenotati) + parseInt(persone) > parseInt(hotel.disponibilita)) { // (hotel è nelle prenotazioni AND data_prenotazione in range and  NON disponibile)  
                    console.log("Nel giorno: " + result.rows[j].data_pernotto + " l'hotel con id: " + result.rows[j].hotel_id + " NON è DISPONIBILE. LA PRENOTAZIONE NON SI PUò FARE");
                    return;
                }
            }
            console.log("Ho controllato tutti i giorni e non ci sono giorni pieni e/o i giorni non sono nel range");
            minidb.add(hotel);
            return;
        }
    }
}
// 



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
    var cucina = cookie.parse(req.headers.cookie || '');

    var cookies = cucina.email_profilo_cookie;
    var cities = new Set();
    database.forEach(item => { cities.add(item.citta); });

    if (cookies) {
        var ma = cookies.split(',');
        var pr = cookies.replace(ma[0] + ',', '');
        ma = ma[0];

        var email_cookie = ma;
        var profilo_cookie = pr;
        console.log("ho ricevuto i cookie...");
        console.log(email_cookie + ' ' + profilo_cookie);

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
    //console.log(checkin + ' ' + checkout + ' ' + luogo + ' ' + persone);

    var minidb = new Set();
    var rangeDate = getDates(checkin, checkout);

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
            totalAvilability(QueryResult, minidb, rangeDate, persone); //leva gli hotel da miniDb che non sono disponibili in rangeDate a persone

            var cucina = cookie.parse(req.headers.cookie || '');
            var cookies = cucina.email_profilo_cookie;
            if (cookies) {
                var ma = cookies.split(',');
                var pr = cookies.replace(ma[0] + ',', '');
                ma = ma[0];

                var email_cookie = ma;
                var profilo_cookie = pr;
                console.log("ho ricevuto i cookie...");
                console.log(email_cookie + ' ' + profilo_cookie);

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
            placeAvilability(luogo, QueryResult, minidb, rangeDate, persone);

            var cucina = cookie.parse(req.headers.cookie || '');
            var cookies = cucina.email_profilo_cookie;
            if (cookies) {
                var ma = cookies.split(',');
                var pr = cookies.replace(ma[0] + ',', '');
                ma = ma[0];

                var email_cookie = ma;
                var profilo_cookie = pr;
                console.log("ho ricevuto i cookie...");
                console.log(email_cookie + ' ' + profilo_cookie);

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
            hotelAvilability(hotel, QueryResult, minidb, rangeDate, persone);

            var cucina = cookie.parse(req.headers.cookie || '');
            var cookies = cucina.email_profilo_cookie;
            if (cookies) {
                var ma = cookies.split(',');
                var pr = cookies.replace(ma[0] + ',', '');
                ma = ma[0];

                var email_cookie = ma;
                var profilo_cookie = pr;
                console.log("ho ricevuto i cookie...");
                console.log(email_cookie + ' ' + profilo_cookie);

                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, cookie: email_cookie, profilo: profilo_cookie, query: ricerca });

            } else {
                console.log("non ho ricevuto i cookie");
                res.render('ricerca.ejs', { data: database, cittas: cities, results: minidb, profilo: '', query: ricerca });
            }
        });
    }
});

app.post('/prenota', urlencodedParser, function(req, res) {
    console.log('post /prenota');

    var cucina = cookie.parse(req.headers.cookie || '');
    var cookies = cucina.email_profilo_cookie;
    var ma = cookies.split(',');
    var pr = cookies.replace(ma[0] + ',', '');
    ma = ma[0];
    var email_cookie = ma;
    var profilo_cookie = pr;
    console.log("ho ricevuto i cookie...");
    console.log(email_cookie + ' ' + profilo_cookie);

    var checkin = req.body.CheckIn;
    var checkout = req.body.CheckOut;
    var luogo = req.body.testo_ricerca;
    var persone = req.body.partecipants;
    var prezzo = req.body.prezzo_finale;
    ricerca = [luogo, checkin, checkout, persone, prezzo];
    var minidb = new Set();
    var rangeDate = getDates(checkin, checkout);
    var hotel;

    for (var i = 0; i < (Object.keys(database).length); i++) {
        if (String(database[i].titolo) == String(luogo)) {
            hotel = database[i]
            break;
        }
    }
    let queryHotel = 'with somma as (select hotel_id,data_pernotto,partecipanti from prenotazioni where hotel_id=\'' + hotel.id + '\') select somma.hotel_id,somma.data_pernotto, sum(somma.partecipanti) from somma group by (somma.hotel_id,somma.data_pernotto) order by (somma.hotel_id,somma.data_pernotto)';
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
        hotelAvilability(hotel, QueryResult, minidb, rangeDate, persone);
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

                rangeDate.forEach(giorno_pern => {
                    client.query('insert into prenotazioni values (' + '\'' + email_cookie + '\',' + '\'' + id_booking + '\',' + '\'' + hotel.id + '\',' + '\'' + persone + '\',' + '\'' + giorno_pern + '\');', function(error, result) {
                        if (error) {
                            console.log(error);
                            return;
                        }
                    })
                    id_booking++;

                });
                console.log("Prenotazione registrata correttamente nel sistema!");
                res.redirect('/profilo');
                res.end();
                return;
            });

        } else { //altrimenti rimanda la ricerca

            console.log("hotel non disponibile in quelle date");
            res.render('titolo.ejs', { offerta: database[hotel.id], profilo: profilo_cookie, search: ricerca });
        }
    });


});

app.get('/offerte', function(req, res) {

    var cucina = cookie.parse(req.headers.cookie || '');

    var cookies = cucina.email_profilo_cookie;

    if (cookies) {
        //  var temp = cookies.split(',');

        var ma = cookies.split(',');
        var pr = cookies.replace(ma[0] + ',', '');
        ma = ma[0];

        var email_cookie = ma;
        var profilo_cookie = pr;
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

    var cucina = cookie.parse(req.headers.cookie || '');

    var cookies = cucina.email_profilo_cookie;

    if (cookies) {
        var ma = cookies.split(',');
        var pr = cookies.replace(ma[0] + ',', '');
        ma = ma[0];

        var email_cookie = ma;
        var profilo_cookie = pr;
        console.log("ho ricevuto i cookie...");
        console.log(email_cookie + ' ' + profilo_cookie);

        res.render('titolo.ejs', { offerta: database[req.query.id], profilo: profilo_cookie, search: '' });

    } else {
        console.log("non ho ricevuto i cookie");
        res.render('titolo.ejs', { offerta: database[req.query.id], profilo: '', search: '' });
    }





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
            res.send("<p>L'email inserita non è registrata nel sistema o non è stata scritta correttamente. Clicca <a href='/'>qui<a> per tornare all'homepage </p> ");
            return;
        } else {
            client.query('select * from utente where email=' + '\'' + mail + '\'' + ' and password=' + '\'' + password + '\'', function(error, result) {
                if (error) {
                    console.log(error);
                    return;
                } else if (result.rows[0] == undefined) {
                    res.send("<p>Password sbagliata. Clicca <a href='/'>qui<a> per tornare all'homepage </p> ");
                    return;
                } else {
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
                maxAge: 60 * 60 // 1 hour
            }));

            console.log("Cookies settati");
        }
        res.redirect('/');
        res.end();
        return;


    };



});


app.get('/logout', function(req, res) {
    console.log('get /logout');

    const p1 = Promise.resolve(res.clearCookie("email_profilo_cookie"));

    p1.then(value => {
        //   res.render('index.ejs', { data: database, profilo: '' });
        res.redirect('/');
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
    var indirizzo = req.body.address;
    var sesso;
    if (req.body.Msex == undefined) { sesso = req.body.Fsex } else { sesso = req.body.Msex }
    console.log(nome + ' ' + cognome + ' ' + mail + ' ' + indirizzo + ' ' + sesso);

    client.query('insert into utente(email,password,foto_profilo,nome,cognome,indirizzo,sesso) values (' + '\'' + mail + '\',' + '\'' + pass + '\',' + '\'' + String('https://cdn.calciomercato.com/images/2019-05/Whatsapp.senza.immagine.2019.1400x840.jpg') + '\',' + '\'' + nome + '\',' + '\'' + cognome + '\',' + '\'' + indirizzo + '\',' + '\'' + sesso + '\');', function(error, result) {

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

app.get('/signin', function(req, res) {
    var cucina = cookie.parse(req.headers.cookie || '');
    var cookies = cucina.email_profilo_cookie;
    if (cookies) {
        res.redirect('/');
    } else {
        console.log('get /signin');
        res.sendFile(path.join(__dirname, '/sigin.html'));
    }


});

app.get('/profilo', urlencodedParser, function(req, res) {

    console.log('get /profilo');

    var cucina = cookie.parse(req.headers.cookie || '');

    var cookies = cucina.email_profilo_cookie;

    if (cookies) {
        var ma = cookies.split(',');
        var pr = cookies.replace(ma[0] + ',', '');
        ma = ma[0];

        var email_cookie = ma;
        var profilo_cookie = pr;
        console.log("ho ricevuto i cookie...");
        console.log(email_cookie + ' ' + profilo_cookie);
        var dati_profilo = [];
        var dati_prenotazioni = new Set();
        client.query('select * from utente left join prenotazioni on email=user_email where email=\'' + email_cookie + '\'', function(error, result) {
            if (error) {
                console.log(error);
                return;
            }

            console.log(result.rows);
            var n = result.rows[0].nome;
            var c = result.rows[0].cognome;
            var p = result.rows[0].foto_profilo;
            var i = result.rows[0].indirizzo;
            var s = result.rows[0].sesso;
            dati_profilo = [n, c, p, i, s];

            client.query('with range as (select hotel_id, partecipanti, min(data_pernotto) as checkin, max(data_pernotto) as checkout from prenotazioni where user_email=\'' + email_cookie + '\' group by (hotel_id, partecipanti)  )  select * from range', function(error, result) {
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

                    let prenotazione = [immagine, titolo, Cin.toISOString().split('T')[0], Cout.toISOString().split('T')[0], partecipanti, prezzo];
                    dati_prenotazioni.add(prenotazione);
                });
                res.render('profile.ejs', { d_profilo: dati_profilo, dati_book: dati_prenotazioni, mail: email_cookie, profilo: profilo_cookie });
            });

        });
    } else {
        console.log("non ho ricevuto i cookie");
        res.redirect('/signin');
    }





    //res.sendFile(path.join(__dirname, '/profile.html'));


});

var server = app.listen(port, function() {});
console.log('listen at  http://127.0.0.1:' + port);