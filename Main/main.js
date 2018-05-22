var admin = require('firebase-admin');
var SerialPort = require('serialport');

var serviceAccount = require('./smart-plant-75235-firebase-adminsdk-pcxba-1c74fefac1.json');

// init firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://smart-plant-75235.firebaseio.com/'
});
// Get a database reference to our blog
var db = admin.database();
var plants = db.ref("plants");

// set serial port
var port = new SerialPort('/dev/tty-usbserial1', {
    baudRate: 19200
});


// Start the Main
console.log("Start Main");


// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})

// Switches the port into "flowing mode"
port.on('data', function (data) {
  console.log('Data:', data);
});

// Read data that is available but keep the stream from entering "flowing mode"
port.on('readable', function () {
  console.log('Data:', port.read());
});


function initDB(elem){
    plants.set([elem]);
}

function addPlant(elem){
    plants.once("value", function(snapshot) {
        var json = snapshot.val();
        json.push(elem);
        plants.set(json);
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

var elem =  {
    "plantID": 0,
    "info":[{
            "date": 0,
            "temperature": 0,
            "light": 0,
            "ph": 0}]
};

// initDB(elem);
// addPlant(elem);
