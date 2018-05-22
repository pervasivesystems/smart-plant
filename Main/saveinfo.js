var admin = require('firebase-admin');
var SerialPort = require('serialport');

var serviceAccount = require('./smart-plant-75235-firebase-adminsdk-pcxba-1c74fefac1.json');
// init firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smart-plant-75235.firebaseio.com/'
});

var db = admin.database();
var plants = db.ref("plants");
var port;



SerialPort.list((err, ports) => {
    // trovo la porta con stm attaccato
    for (var i = 0; i < ports.length; i++) {
        if (ports[i].manufacturer === "STMicroelectronics") {
            var port = new SerialPort(ports[i].comName, {
                baudRate: 19200
            });
            break;
        }
    }

    // Open errors will be emitted as an error event
    port.on('error', function(err) {
        console.log('Error: ', err.message);
    })
});


function saveInfo(id, info) {
    plants.once("value", function(snapshot) {

        // TODO

    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}
