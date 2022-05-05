function getCookies(cookies){
    var ma = cookies.split(',');
    var email_cookie = ma[0];
    var profilo_cookie = ma[1];
    console.log('cookies = '+email_cookie + ' ' + profilo_cookie);
    return [email_cookie, profilo_cookie];
    
}


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
            if (rangeDate.includes(result.rows[j].data_pernotto) && parseInt(result.rows[j].prenotati) + parseInt(persone) > parseInt(database[idAlbergo].disponibilita)) {
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
                if (rangeDate.includes(result.rows[j].data_pernotto) && parseInt(result.rows[j].prenotati) + parseInt(persone) > parseInt(database[idAlbergo].disponibilita)) {
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
                if (String(result.rows[j].hotel_id) == String(hotel.id) && rangeDate.includes(result.rows[j].data_pernotto) && parseInt(result.rows[j].prenotati) + parseInt(persone) > parseInt(hotel.disponibilita)) { // (hotel è nelle prenotazioni AND data_prenotazione in range and  NON disponibile)  
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

module.exports = { getCookies, getDates, totalAvilability, placeAvilability, hotelAvilability };