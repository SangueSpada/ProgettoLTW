# ProgettoLTW

### Authors ###

- Francesco Saverio Sconocchia Pisoni 1889241
- Aras Leonardo Kankilic 1888465

### Descrizione ###

Italia in viaggio si propone di essere un sito di offerte di hotel rivolto a grandi catene di alberghi. Infatti l’idea di base si fonda sul fatto di avere un database interno tramite cui è possibile consultare le informazioni e le disponibilità di ogni singolo hotel presente nel sito.
Tramite la barra di ricerca presente nella pagina iniziale è possibile effettuare tre tipi di ricerche:
1) Cercare tutti gli hotel presenti sul sito in base alle date di checkin, checkout e partecipanti
2) Cercare gli hotel di una città presenti sul sito in base a “ “ “
3) Cercare un singolo hotel presente sul sito in base a “ “ “
Per prenotare un alloggio è necessario aver fatto prima l’accesso.
All’interno della propria pagina profilo è possibile successivamente cancellare le prenotazioni fatte se non sono già state “effettuate” a livello temporale.

### Tools e framework utilizzati ###

Tools e framework utilizzati
- NodeJs (v.16.14.0) - back-end
- Express
- Ejs
- Jquery
- Bootstrap
- Postgresql
- Ajax

### Installazione e avvio del sito ###

Per il corretto funzionamento della gestione utenti e delle loro relative prenotazioni è necessario creare due tables su un database di Postgresql:
1) configurare le credenziali del proprio db all’interno del file credenziali.json
2) su posgres creare due tables con i seguenti comandi:

create table utente(email varchar, password varchar, foto_profilo varchar, nome varchar, cognome varchar,  indirizzo varchar, sesso varchar, primary key(email));

create table prenotazioni(user_email varchar, id_booking integer, hotel_id integer, partecipanti integer, data_pernotto date, timestamp varchar, primary key(user_email, id_booking));

3) Infine aprire una shell/terminale all’interno della cartella ed eseguire il comando: 
node server.js
