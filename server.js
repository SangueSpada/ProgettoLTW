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
var getDates = function(start, end) {
    for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
        arr.push(new Date(dt));
    }
    return arr;
};
//fine metodo ausiliario

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
        var ma = cookies.split(',');
        var pr = cookies.replace(ma[0] + ',', '');
        ma = ma[0];

        var email_cookie = ma;
        var profilo_cookie = pr;
        var profilo_cookie = temp[1];
        console.log("ho ricevuto i cookie...");
        console.log(email_cookie + ' ' + profilo_cookie);


        client.query('select * from utente where email=\'' + email_cookie + '\'', function(error, result) {
            if (error) {
                console.log(error);
                return;
            }
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




app.post('/ricerca', urlencodedParser, function(req, res) {

    console.log('get /ricerca');
    console.log(req.body);

    var checkin = req.body.CheckIn;
    var checkout = req.body.CheckOut;
    var luogo = (req.body.testo_ricerca);
    var persone = req.body.partecipants;
    ricerca = [luogo, checkin, checkout, persone];
    console.log(checkin + ' ' + checkout + ' ' + luogo + ' ' + persone);
    var cucina = cookie.parse(req.headers.cookie || '');
    var cookies = cucina.email_profilo_cookie;
    var minidb=[];
    var rangeDate=getDates(checkin,checkout,true);
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
        var id_hotel;
        //console.log(Object.keys(database).length);
        for(var i=0;i<(Object.keys(database).length);i++){
            console.log(database[i]);
            if(String(database[i].titolo)==String(luogo)){ 
                id_hotel=database[i].id
                console.log("ecco l'id "+id_hotel);
                break;
            }
        }
        let queryHotel='select * from prenotazioni where hotel_id=\''+id_hotel+'\' group by(user_email,id_booking,hotel_id,data_pernotto)';
        client.query(queryHotel, function(error, result) {
            if (error) {
                console.log(error);
                return;
            }
            let hotels_prenotati=[];
            for (var k=0;k<result.rows.length;k++){
                hotels_prenotati.push(result.rows[k].hotel_id);
            }

            if(!(hotels_prenotati.includes(id_hotel))){//se(hotel non prenotato)
                minidb.push(hotels_prenotati);
                console.log("L'hotel "+id_hotel+" è disponibile");

            }
            else{
                for(var j=0;j<result.rows.length;j++){
                    if( (String(result.rows[j].hotel_id)==String(hotel.id) && rangeDate.includes(result.rows[j]) && result.rows[j].prenotati < hotel.disponibilita) || 
                        (String(result.rows[j].hotel_id)==String(hotel.id) && !(rangeDate.includes(result.rows[j]))) ){ //(hotel prenotato ma non nelle date in range) or (hotel è nelle prenotazioni AND data_prenotazione in range and disponibile)  
                            minidb.push(hotels_prenotati);
                            console.log("L'hotel "+id_hotel+" è disponibile");
                    }
                }
            }

        })
    //}

    /*if (luogo != '') {

        for (var i = 0; i < database.length; i++) {

            var hotel = database[i];

            //se ricerco una citta o un hotel
            if (hotel.disponibilita >= persone) {

                if (hotel.citta === luogo || hotel.titolo === luogo) {

                    //  console.log(Date.parse(checkin) + ' ' + Date.parse(d.checkin) + ' ' + Date.parse(checkout) + ' ' + Date.parse(d.checkout));
                    if (new Date(checkin) >= new Date(hotel.checkin) && new Date(checkout) <= new Date(hotel.checkout)) {
                        minidb.push(hotel);
                    }
                }
            }
        }
    }
    //se ricerco solo tramite data e disponibilità posti di un hotel specifico
    else {
        for (var i = 0; i < database.length; i++) {

            var hotel = database[i];

            if (hotel.disponibilita >= persone) {
                if (new Date(checkin) >= new Date(hotel.checkin) && new Date(checkout) <= new Date(hotel.checkout)) {

                    minidb.push(hotel);
                }

            }
        }

    }*/

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




app.post('/login', urlencodedParser, function(req, res) {

    console.log('post /login');
    var mail = req.body.mail;
    var password = md5(req.body.password);
    var profilo;
    client.query('select * from utente where email=' + '\'' + mail + '\'', function(error, result) {
        if (error) { 
            console.log(error);
            return; 
        }
        else if(result.rows[0] == undefined){
            res.send("<p>L'email inserita non è registrata nel sistema o non è stata scritta correttamente. Clicca <a href='/'>qui<a> per tornare all'homepage </p> "); 
            return;
        }
        else{
            client.query('select * from utente where email=' + '\'' + mail + '\'' + ' and password=' + '\'' + password + '\'', function(error, result) {
                if (error) { 
                    console.log(error);
                    return; 
                }
                else if(result.rows[0] == undefined){
                    res.send("<p>Password sbagliata. Clicca <a href='/'>qui<a> per tornare all'homepage </p> "); 
                    return;
                }
                else{
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