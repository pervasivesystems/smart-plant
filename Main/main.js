var admin = require('firebase-admin');
var SerialPort = require('serialport');
var express = require('express');
var request = require('request');
var wood_db = require('./wood_db_scraper.js');
var serviceAccount = require('./smart-plant-75235-firebase-adminsdk-pcxba-1c74fefac1.json');
var app = express();
const Telegraf = require('telegraf')
var bot;
var fs = require('fs');
var path = require('path');
const commandParts = require('./telegraf-command-parts/index.js');


var readStream = fs.createReadStream(path.join(__dirname) + '/telegram_bot_token.txt', 'utf8');
let token = ''
var chatId;


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
    "plant":"Rose",
    "status": [{
        // "date": 0,
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


    readStream.on('data', function(chunk) {
        token += chunk;
    }).on('end', function() {
        // console.log(token.trim());
        bot = new Telegraf(token.trim());
        bot.use(commandParts());

        parser.on('data', function(data){ //tmp,lgt,ph
            data = "1,2,3" // commentare quando ci sarà la scheda vera
            console.log(data);
            var status = data.split(',');
            elem.status.temperature = status[0];
            elem.status.light = status[1];
            elem.status.ph = status[2];
            // wood_db.search(elem.plant, (err, result)=>{
            if(status[2]>result.info.soilph.max){
                bot.telegram.sendMessage(chatId, "PH too Basic!")
            }
            if(status[2]<result.info.soilph.min){
                bot.telegram.sendMessage(chatId, "PH too Acid!")
            }
            // TODO: controllare gli altri parametri, se manca acqua annaffiare

            saveInfo(0, elem.status);
        });


        bot.start((ctx) => {
            chatId=ctx.chat.id;
            ctx.reply('Welcome! This is Smart Plant.')
        })

        bot.command('/water', (ctx) => {
            console.log(ctx.state.command);
            port.write("1", function(err) {
                if (err) {
                    ctx.reply('error')
                    return console.log('Error on write: ', err.message);
                }
                console.log('message written');
                ctx.reply('Ok, water')
            });
        })

        bot.command('/status', (ctx) => {
            retrivePlant(elem.plantID, (err, result)=>{
                console.log(result);
                var last = result[result.length-1];
                var string = "Light: "+ last.light +"\n";
                string += "PH: "+ last.ph +"\n";
                string += "Temperature: "+ last.temperature +"\n";
                ctx.reply(string)
            });
        })

        bot.command('/startsensor', (ctx) => {
            port.write("3", function(err) { //
                if (err) {
                    ctx.reply('error')
                    return console.log('Error on write: ', err.message);
                }
                console.log('message written');
                ctx.reply('Ok, I started the sensors')
            });

        })

        bot.command('/info', (ctx) => {
            wood_db.search(elem.plant,(err, result)=>{
                if(err) ctx.reply('error');
                else{
                    // TODO: formattare bene in una stringa
                    var string ="";
                    string += "*"+elem.plant+"*\n";
                    var url ="http://www.rosai-e-piante-meilland.it/media/catalog/product/cache/3/image/800x800/040ec09b1e35df139433887a97daa66f/1/0/1060-2946-rosier_edith_piaf_meiramboys-mi-t1000.jpg";
                    // url = result.img+"";
                    // url=url.trim();
                    // console.log(result.img);
                    bot.telegram.sendPhoto(ctx.chat.id, url, {caption:string, parse_mode:"Markdown"})

                    string  = "\n*Light*: "+result.info.light.description;
                    string += "\n*Water*: "+result.info.water.description;
                    string += "\n*Soil PH*: "+result.info.soilph.description;
                    bot.telegram.sendMessage(ctx.chat.id, string, {parse_mode:"Markdown"})
                    // string += "![alt tag]("+ result.img + ")"
                    // telegram.sendMediaGroup(chatId, media, [extra]) => Promise

                    // ctx.reply(JSON.stringify(result));
                }
            })
        })

        bot.command('/setplant', (ctx) => {
            console.log(ctx.state);
            if(ctx.state.command.args === '') {
                ctx.reply("name of the plant or flower required \n/setplant plant_name");
                return;
            }
            elem.plant=ctx.state.command.args;
            setPlant(elem)
            ctx.reply("You set the plant as a " + ctx.state.command.args);
        });

        bot.command('/help', (ctx) => {
            ctx.reply('Welcome! This is Smart Plant.\nUse the commands to interact.')
        })



        bot.startPolling();



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
            console.log("/info");
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

        // console.log('Listening on 3000');
        // app.listen(3000);
    })
})


// setPlant(elem);
// retrivePlant(0,(err, res)=>{console.log(res);})

// save data in firebase db
function saveInfo(id, status) {
    plants.once("value", function(snapshot) {
        var json = snapshot.val();
        var plant = json[elem.plantID];
        plant.status.push(status);
        setPlant(plant);
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
        json = json[elem.plantID];
        // console.log(snapshot.val());
        if(json.plantID == id){
            if (json.status === undefined)
            callback(null, []);
            else
            callback(null, json.status);
            return;
        }

        callback(null, []);
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
        callback(errorObject, null);
    });
}

// save the plant in db
function setPlant(elem) {
    plants.once("value", function(snapshot) {
        plants.set([elem]);
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
