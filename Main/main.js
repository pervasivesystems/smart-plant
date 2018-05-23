var admin = require('firebase-admin');
var SerialPort = require('serialport');
var express = require('express');
var request = require('request');
var wood_db = require('./wood_db_scraper.js');

var serviceAccount = require('./smart-plant-75235-firebase-adminsdk-pcxba-1c74fefac1.json');
var app = express();

// init firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smart-plant-75235.firebaseio.com/'
});
// Get a database reference to our blog
var db = admin.database();
var plants = db.ref("plants");

var port;
var id = 0;
var elem = {
    "plantID": 0,
    "plant":"rose",
    "info": [{
        "date": 0,
        "temperature": 0,
        "light": 0,
        "ph": 0
    }]
};



// Start the Main
console.log("Start Main");
const parsers = SerialPort.parsers;

// Use a `\r\n` as a line terminator
const parser = new parsers.Readline({
  delimiter: '\r\n'
});


SerialPort.list((err, ports) => {
    // trovo la porta con stm attaccato
    for (var i = 0; i < ports.length; i++) {
        if (ports[i].manufacturer === "STMicroelectronics") {
            port = new SerialPort(ports[i].comName, {
                baudRate: 230400
            });
            break;
        }
    }
    // Open errors will be emitted as an error event
    port.on('error', function(err) {
        console.log('Error: ', err.message);
    })
    port.pipe(parser);

    parser.on('data', function(data){ //tmp,lgt,ph
        data = "1,2,3" // commentare quando ci sarà la scheda vera
        console.log(data);
        var info = data.split(',');
        elem.info.temperature = info[0];
        elem.info.light = info[1];
        elem.info.ph = info[2];
        search(elem.plant, (err, result)=>{
            if(info[2]>result.soilph.max){

            }
            if(info[2]<result.soilph.min){

            }

        });
        // saveInfo(0, elem.info);
    });




    app.get("/", function(req, res) {
        console.log("/home");
        res.send("ok");
    })


    app.get("/water", function(req, res) {
        console.log("/water");
        // water command
        port.write("1", function(err) { //
            if (err) {
                res.send('err');
                return console.log('Error on write: ', err.message);
            }
            console.log('message written');
            res.send("ok");
        });
    })

    app.get("/info/:name", function(req, res) {
        console.log("/info");
        wood_db.search(req.params.name,(err, result)=>{
            if(err) res.send(err);
            else    res.send(result);
        })
    })

    console.log('Listening on 3000');
    app.listen(3000);

})


// save data in firebase db
function saveInfo(id, info) {
    plants.once("value", function(snapshot) {
        var json = snapshot.val();
        for (var i = 0; i < json.length; i++) {
            if(json[i].plantID == id){
                json.push(info);
                plants.set(json);
                break;
            }
        }
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}


// setPlant(elem);


// NOT USED
function retrivePlant(id, callback){
    plants.once("value", function(snapshot) {
        if (snapshot.val() === undefined) {
            callback(null, []);
            return;
        }
        var json = snapshot.val();
        for (var i = 0; i < json.length; i++) {
            if(json[i].plantID == id){
                if (json[i].info === undefined)
                callback(null, []);
                else
                callback(null, json[i].info);
                return;
            }
        }
        callback(null, []);
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
        callback(errorObject, null);
    });
}

function addPlant(elem) {
    plants.once("value", function(snapshot) {
        elem.plantID=id;
        id++;
        elem.info = [];
        if (snapshot.val() === undefined) {
            plants.set([elem]);
            return;
        }
        var json = snapshot.val();
        json.push(elem);
        plants.set(json);
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function setPlant(elem) {
    plants.once("value", function(snapshot) {
        elem.info=[];
        plants.set(elem);
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}
