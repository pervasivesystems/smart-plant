var admin = require('firebase-admin');
var SerialPort = require('serialport');
var express = require('express');
var request = require('request');
var wood_db = require('./lib/wood_db_scraper.js');
var serviceAccount = require('./smart-plant-75235-firebase-adminsdk-pcxba-1c74fefac1.json');
var app = express();
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
var bot;
var fs = require('fs');
var path = require('path');
const commandParts = require('./lib/telegraf_command_parts.js');


var readStream = fs.createReadStream(path.join(__dirname) + '/telegram_bot_token.txt', 'utf8');
let token = ''
var chatId;
var page;


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
        "date": "YYYY:MM:DD:HH:MM:SS",
        "temperature": 0,
        "light": 0,
        "ph": 0
    }]
};
var woody={};


// Start the Main
console.log("Start Main");
const parsers = SerialPort.parsers;

// Use a `\r\n` as a line terminator
const parser = new parsers.Readline({
  delimiter: '\r\n'
});


SerialPort.list((err, ports) => {
    // trovo la porta con stm attaccato
    // console.log(ports)
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

        parser.on('data', function(tlp){ //tmp,lgt,ph
            tlp = "1,2,3" // commentare quando ci sarà la scheda vera
            console.log(tlp);
            var status = tlp.split(',');
            var time = getDateTime();
            elem.status[0].date=time;
            elem.status[0].temperature = status[0];
            elem.status[0].light = status[1];
            elem.status[0].ph = status[2];
            check(status[0]);
            saveInfo(0, elem.status[0]);

        });


        bot.command('key', ({ reply }) => {
          return reply('Custom buttons keyboard', Markup
            .keyboard([
              ['/water', '/status'],
              ['/startsensor', '/info'],
              ['/setplant', '/help'],
              ['hide buttons']
            ])
            // .oneTime()
            .resize()
            .extra()
          )
        })

        bot.hears('hide buttons', ctx => {
             ctx.reply('Hide keyboard', Markup.removeKeyboard(true).extra())
        })
        bot.hears('l', ctx => {
             leggi()
        })
        bot.hears('s', ctx => {
             chatId=ctx.chat.id
             wood_db.search(elem.plant, (err, result)=>{
                 woody=result;
             })
        })


        bot.start((ctx) => {
            chatId=ctx.chat.id;
            ctx.reply('Welcome! This is Smart Plant.', Markup
                .keyboard([
                  ['/water', '/status'],
                  ['/startsensor', '/info'],
                  ['/setplant', '/help'],
                  ['hide buttons']
                ])
                .resize()
                .extra())
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
                // console.log(result);
                if(result.length==0){
                    ctx.reply('no information');
                    return;
                }
                page=result.length-1;
                var last = result[page];
                var data=last.date.split(':');  // YYYY:MM:DD:HH:MM:SS
                var string = "This is the status on "+data[2]+"/" +data[1]+"/"+data[0] +" at " +data[3]+":"+data[4]+"\n";
                string += "Light: "+ last.light +"\n";
                string += "PH: "+ last.ph +"\n";
                string += "Temperature: "+ last.temperature +"\n";
                ctx.reply(string, Markup.inlineKeyboard([
                  Markup.callbackButton('Previous', 'Previous'),
                  Markup.callbackButton('Next', 'Next')
              ]).extra())
                check(last)
            });

        })
        bot.action('Next', (ctx) => {
            retrivePlant(elem.plantID, (err, result)=>{
                // console.log(result);
                // console.log(page);
                if(page>=result.length-1){
                    ctx.reply('no other information');
                    return;
                }
                page = page + 1;
                var last = result[page];
                var data=last.date.split(':');  // YYYY:MM:DD:HH:MM:SS
                var string = "This is the status on "+data[2]+"/" +data[1]+"/"+data[0] +" at " +data[3]+":"+data[4]+"\n";
                string += "Light: "+ last.light +"\n";
                string += "PH: "+ last.ph +"\n";
                string += "Temperature: "+ last.temperature +"\n";
                ctx.reply(string, Markup.inlineKeyboard([
                  Markup.callbackButton('Previous', 'Previous '),
                  Markup.callbackButton('Next', 'Next')
              ]).extra())
                check(last)
            });
        })
        bot.action('Previous', (ctx) => {
            retrivePlant(elem.plantID, (err, result)=>{
                // console.log(result);
                console.log(page);
                if(page<=0){
                    ctx.reply('no other information');
                    return;
                }
                page = page - 1;
                var last = result[page];
                var data=last.date.split(':');  // YYYY:MM:DD:HH:MM:SS
                var string = "This is the status on "+data[2]+"/" +data[1]+"/"+data[0] +" at " +data[3]+":"+data[4]+"\n";
                string += "Light: "+ last.light +"\n";
                string += "PH: "+ last.ph +"\n";
                string += "Temperature: "+ last.temperature +"\n";
                ctx.reply(string, Markup.inlineKeyboard([
                  Markup.callbackButton('Previous', 'Previous'),
                  Markup.callbackButton('Next', 'Next')
              ]).extra())
                check(last)
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
            var string ="";
            string += "*"+elem.plant+"*\n";
            var url ="http://www.rosai-e-piante-meilland.it/media/catalog/product/cache/3/image/800x800/040ec09b1e35df139433887a97daa66f/1/0/1060-2946-rosier_edith_piaf_meiramboys-mi-t1000.jpg";
            // url = woody.img+"";
            // url=url.trim();
            // console.log(woody.img);
            bot.telegram.sendPhoto(ctx.chat.id, url, {caption:string, parse_mode:"Markdown"})

            string  = "\n*Light*: "+woody.info.light.description;
            string += "\n*Water*: "+woody.info.water.description;
            string += "\n*Soil PH*: "+woody.info.soilph.description;
            bot.telegram.sendMessage(ctx.chat.id, string, {parse_mode:"Markdown"})
        })

        bot.command('/setplant', (ctx) => {
            console.log(ctx.state);
            if(ctx.state.command.args === '') {
                ctx.reply("name of the plant or flower required \n/setplant plant_name");
                return;
            }
            elem.plant=ctx.state.command.args;
            ctx.reply("You set the plant as a " + ctx.state.command.args);
            setPlant(elem)
            wood_db.search(elem.plant, (err, result)=>{
                woody=result;
            })
        });

        bot.command('/help', (ctx) => {
            ctx.reply('Welcome! This is Smart Plant.\nUse the commands to interact.')
            ctx.reply('use /key to use buttons')
        })


        bot.startPolling();


    })
})


// setPlant(elem);
// retrivePlant(0,(err, res)=>{console.log(res);})



function leggi(){
    var x1 = "1,2,3" // commentare quando ci sarà la scheda vera
    console.log(x1);
    var status = x1.split(',');
    var time = getDateTime();
    elem.status[0].date=time;
    elem.status[0].temperature = status[0];
    elem.status[0].light = status[1];
    elem.status[0].ph = status[2];

        if(status[2]>woody.info.soilph.max){
            bot.telegram.sendMessage(chatId, "PH too Basic!")
        }
        if(status[2]<woody.info.soilph.min){
            bot.telegram.sendMessage(chatId, "PH too Acid!")
        }
        // TODO: controllare gli altri parametri, se manca acqua annaffiare
        // console.log(elem.status);
        saveInfo(0, elem.status[0]);

}

function check(status){
    console.log(woody);
    console.log(status);
    if(status.ph>woody.info.soilph.max){
        bot.telegram.sendMessage(chatId, "PH too Basic!")
    }
    if(status.ph<woody.info.soilph.min){
        bot.telegram.sendMessage(chatId, "PH too Acid!")
    }
    // TODO: controllare gli altri parametri, se manca acqua annaffiare
    // console.log(elem.status);
}


// save data in firebase db
function saveInfo(id, status) {
    console.log(status);
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

//YYYY:MM:DD:HH:MM:SS
function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

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
