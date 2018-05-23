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
    "status": [{
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
        var status = data.split(',');
        elem.status.temperature = status[0];
        elem.status.light = status[1];
        elem.status.ph = status[2];
        search(elem.plant, (err, result)=>{
            if(status[2]>result.soilph.max){

            }
            if(status[2]<result.soilph.min){

            }

        });
        saveInfo(0, elem.status);
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

    app.get("/status", function(req, res) {
        console.log("/status");
        retrivePlant(elem.plantID, (err, result)=>{
            res.json(result);
        });
    })

    app.get("/start_sensor", function(req, res) {
        console.log("/start_sensor");
        // water command
        port.write("3", function(err) { //
            if (err) {
                res.send('err');
                return console.log('Error on write: ', err.message);
            }
            console.log('message written');
            res.send("ok");
        });
    })

    app.get("/info", function(req, res) {
        console.log("/status");
        wood_db.search(elem.plant,(err, result)=>{
            if(err) res.send(err);
            else    res.send(result);
        })
    })

    app.get("/setPlant/:name", function(req, res) {
        console.log("/setPlant");
        elem.name=req.params.name;
        res.send("ok");
    })

    console.log('Listening on 3000');
    app.listen(3000);

})

// setPlant(elem);

// save data in firebase db
function saveInfo(id, status) {
    plants.once("value", function(snapshot) {
        var json = snapshot.val();
        for (var i = 0; i < json.length; i++) {
            if(json[i].plantID == id){
                json.push(status);
                plants.set(json);
                break;
            }
        }
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

// retrive all "status" of the plant
function retrivePlant(id, callback){
    plants.once("value", function(snapshot) {
        if (snapshot.val() === undefined) {
            callback(null, []);
            return;
        }
        var json = snapshot.val();
        for (var i = 0; i < json.length; i++) {
            if(json[i].plantID == id){
                if (json[i].status === undefined)
                callback(null, []);
                else
                callback(null, json[i].status);
                return;
            }
        }
        callback(null, []);
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
        callback(errorObject, null);
    });
}

// save the first plant in db
function setPlant(elem) {
    plants.once("value", function(snapshot) {
        // elem.status=[];
        plants.set(elem);
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

// NOT used
function addPlant(elem) {
    plants.once("value", function(snapshot) {
        elem.plantID=id;
        id++;
        elem.status = [];
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
