var admin = require('firebase-admin');
var SerialPort = require('serialport');
var express = require('express');
var request = require('request');

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
    "info": [{
        "date": 0,
        "temperature": 0,
        "light": 0,
        "ph": 0
    }]
};


// Start the Main
console.log("Start Main");

SerialPort.list((err, ports) => {
    // trovo la porta con stm attaccato
    for (var i = 0; i < ports.length; i++) {
        if (ports[i].manufacturer === "STMicroelectronics") {
            port = new SerialPort(ports[i].comName, {
                baudRate: 19200
            });
            break;
        }
    }

    // Open errors will be emitted as an error event
    port.on('error', function(err) {
        console.log('Error: ', err.message);
    })

    // Switches the port into "flowing mode"
    // port.on('data', function (data) {
    //   console.log('Data:', data);
    // });
    //
    // Read data that is available but keep the stream from entering "flowing mode"
    // port.on('readable', function() {
    //     console.log('Data:', port.read());
    //     // TODO prendere i dati e formattarli
    //     // saveInfo(0, info);
    // });

    app.get("/", function(req, res) {
        console.log("/home");
        res.send("ok");
    })

    app.get("/addPlant", function(req, res) {
        console.log("/addplant");
        addPlant(elem);
        res.send("ok");
    })

    app.get("/water/:command", function(req, res) {
        console.log("/water");
        // water command
        res.send("ok");
    })

    app.get("/info/:id", function(req, res) {
        console.log("/info", req.params.id);
        retrivePlant(req.params.id, function(err, info){
            if (err) res.send(err)
            else res.json(info);
        });
    })

    console.log('Listening on 3000');
    app.listen(3000);

})


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
