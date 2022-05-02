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
var port = 3334;
app.set('view engine', 'ejs');
app.use(express.static(__dirname)); //per elaborare il css

var database = JSON.parse(fs.readFileSync('hotels.json')); //legge il contenuto di offerte json
var credenziali = JSON.parse(fs.readFileSync('credenziali.json'));
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// metodo per avere un array di date fra due date
async function getDates(start, end) {
    for (var arr = [], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        arr.push(new Date(dt));
    }
    return arr;
}

function Hotelavilability(hotel, result, minidb, rangeDate, persone) {
    let hotels_prenotati = [];
    for (var k = 0; k < result.rows.length; k++) { //inserisce in una lista gli id degli hotel
        hotels_prenotati.push(result.rows[k].hotel_id);
    }
    if (parseInt(persone) > parseInt(hotel.disponibilita)) {
        console.log("L'hotel " + hotel.id + " ha disponibilità minore dei partecipanti richiesti");
        console.log(persone + ' ' + hotel.disponibilita);
    } else {
        if (!(hotels_prenotati.includes(hotel.id))) { //se(hotel non prenotato)
            minidb.push(hotel);
            console.log("L'hotel " + hotel.id + " è disponibile");
            return;
        } else {
            for (var j = 0; j < result.rows.length; j++) { //scorre la lista finchè non trova l'hotel e controlla le altre condizioni
                if (String(result.rows[j].hotel_id) == String(hotel.id) && rangeDate.includes(result.rows[j].data_pernotto) && parseInt(result.rows[j].prenotati) + parseInt(persone) > parseInt(hotel.disponibilita)) { // (hotel è nelle prenotazioni AND data_prenotazione in range and  NON disponibile)  
                    console.log("Nel giorno: " + result.rows[j].data_pernotto + " l'hotel con id: " + result.rows[j].hotel_id + " NON è DISPONIBILE. LA PRENOTAZIONE NON SI PUò FARE");
                    return;
                }
            }
            console.log("Ho controllato tutti i giorni e non ci sono giorni pieni e/o i giorni non sono nel range");
            minidb.push(hotel);
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

    if (cookies) {
        var ma = cookies.split(',');
        var pr = cookies.replace(ma[0] + ',', '');
        ma = ma[0];

        var email_cookie = ma;
        var profilo_cookie = pr;
        console.log("ho ricevuto i cookie...");
        console.log(email_cookie + ' ' + profilo_cookie);

        res.render('index.ejs', { data: database, cookie: email_cookie, profilo: profilo_cookie });

    } else {
        console.log("non ho ricevuto i cookie");
        res.render('index.ejs', { data: database, profilo: '' });
    }
});

app.post('/ricerca', urlencodedParser, function(req, res) {

    console.log('get /ricerca');

    var checkin = req.body.CheckIn;
    var checkout = req.body.CheckOut;
    var luogo = (req.body.testo_ricerca);
    var persone = req.body.partecipants;
    ricerca = [luogo, checkin, checkout, persone];
    console.log(checkin + ' ' + checkout + ' ' + luogo + ' ' + persone);
    var cucina = cookie.parse(req.headers.cookie || '');
    var cookies = cucina.email_profilo_cookie;
    var minidb = [];
    var rangeDate = getDates(checkin, checkout);
    /*if(luogo == ''){
        let queryLess='select hotel_id,sum(partecipanti) as prenotati from prenotazioni group by(user_email,id_booking,hotel_id,data_pernotto)';
        client.query(queryLess, function(error, result) {
            if (error) {
                console.log(error);
                return;
            }
            for (var i = 0; i < database.length; i++) {
                var hotel = database[i];
                for(var j=0;j<result.rows.length;j++){
                    if(rangeDate.includes(result.rows[j])){
                        if(String(result.rows[j].hotel_id)==String(hotel.id) && result.rows[j].prenotati >= hotel.disponibilita){
                            continue;     
                        }
                        else{
                            minidb.push(hotel);
                        }
                    }
                }
            }

        })
    }*/
    //else{
    var hotel;
    //console.log(Object.keys(database).length);
    for (var i = 0; i < (Object.keys(database).length); i++) {
        if (String(database[i].titolo) == String(luogo)) {
            hotel = database[i]
            console.log("ecco l'id " + hotel.id);
            break;
        }
    }
    let queryHotel = 'with somma as (select hotel_id,data_pernotto,partecipanti from prenotazioni where hotel_id=\'' + hotel.id + '\') select somma.hotel_id,somma.data_pernotto, sum(somma.partecipanti) from somma group by (somma.hotel_id,somma.data_pernotto)';
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
        Hotelavilability(hotel, QueryResult, minidb, rangeDate, persone)
        if (cookies) {
            var ma = cookies.split(',');
            var pr = cookies.replace(ma[0] + ',', '');
            ma = ma[0];

            var email_cookie = ma;
            var profilo_cookie = pr;
            console.log("ho ricevuto i cookie...");
            console.log(email_cookie + ' ' + profilo_cookie);

            res.render('ricerca.ejs', { data: minidb, cookie: email_cookie, profilo: profilo_cookie, query: ricerca });

        } else {
            console.log("non ho ricevuto i cookie");
            res.render('ricerca.ejs', { data: minidb, profilo: '', query: ricerca });
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

        res.render('titolo.ejs', { offerta: database[req.query.id], profilo: profilo_cookie });

    } else {
        console.log("non ho ricevuto i cookie");
        res.render('titolo.ejs', { offerta: database[req.query.id], profilo: '' });
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


        client.query('select * from utente where email=\'' + email_cookie + '\'', function(error, result) {
            if (error) {
                console.log(error);
                return;
            }
            var n = String(result.rows[0].nome);
            var c = String(result.rows[0].cognome);
            var p = String(result.rows[0].foto_profilo);
            var i = String(result.rows[0].indirizzo);
            var s = String(result.rows[0].sesso);
            res.render('profile.ejs', { nome: n, cognome: c, mail: email_cookie, profilo: p, indirizzo: i, sesso: s });

        });
    } else {
        console.log("non ho ricevuto i cookie");
        res.sendFile(path.join(__dirname, '/sigin.html'));
    }





    //res.sendFile(path.join(__dirname, '/profile.html'));


});

var server = app.listen(port, function() {});
console.log('listen at  http://127.0.0.1:' + port);