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
const download = require('image-downloader')
var quiche = require('quiche');
var chart = quiche('line');

// var readStream = fs.createReadStream(path.join(__dirname) + '/secret.txt', 'utf8');
let token = ''
let CSE_ID = ''
let API_KEY = ''
var chatId;
var page;
var ok=false;


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
    "plant": undefined,
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
var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('secret.txt')
});
lineReader.on('line', function (line) {
    // console.log('Line from file:', line);
    var l = line.split(" ");
    if(l[0]==="telegram") token = l[1].trim()
    if(l[0]==="googleID") CSE_ID = l[1].trim()
    if(l[0]==="googleAPI") API_KEY = l[1].trim()
    // console.log(token);
})
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
        // console.log(token.trim());
        bot = new Telegraf(token);
        bot.use(commandParts());

        parser.on('data', function(tlp){ //tmp,lgt,ph
            tlp = "1,2,3" // commentare quando ci sarà la scheda vera
            // console.log("data: "+tlp);
            if(woody.name === undefined){ return;}
            if(tlp==="#FATTO!#"){
                ok = true;
                return;
            }
            else{
                tlp=tlp.replace("#","");
                var status = tlp.split(',');
                var time = getDateTime();
                elem.status[0].date=time;
                elem.status[0].temperature = status[0];
                elem.status[0].light = status[1];
                elem.status[0].ph = status[2];
                check(status[0]);
                saveInfo(0, elem.status[0]);
            }

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
            console.log("l");
            chatId=ctx.chat.id
            elem.plant="Rose";
            wood_db.search(elem.plant, (err, result)=>{
                woody=result;
                elem.botanical = result.botanical;
                // leggi()
                ctx.reply("You set the plant as a " + elem.botanical);
                bot.hears('s', ctx => {
                    chatId=ctx.chat.id
                    leggi()
                })
            })
        })

        bot.start((ctx) => {
            console.log("start");
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
            if(woody.info===undefined){
                 ctx.reply("Set your plant/flower first!");
                 return;
            }
            ok = false;
            port.write("1", function(err) {
                if (err) {
                    ctx.reply('error')
                    return console.log('Error on write: ', err.message);
                }
                console.log('message written');
                if(ok)
                    ctx.reply('Ok, water')
                else
                    ctx.reply('Retry')
            });
        })

        bot.command('/status', (ctx) => {
            if(woody.info===undefined){
                 ctx.reply("Set your plant/flower first!");
                 return;
             }
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
                string += "\n*Light*: "+ last.light +"\n";
                string += "*PH*: "+ last.ph +"\n";
                string += "*Temperature*: "+ last.temperature +"\n";
                var extra = Markup.inlineKeyboard([
                    Markup.callbackButton('< Previous', 'Previous'),
                    Markup.callbackButton('Graph', 'Graph'),
                    Markup.callbackButton('Next >', 'Next')]).extra();
                var mark = {parse_mode:"Markdown"};
                var j = Object.assign(mark,extra);
                ctx.reply(string,j)
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
                string += "\n*Light*: "+ last.light +"\n";
                string += "*PH*: "+ last.ph +"\n";
                string += "*Temperature*: "+ last.temperature +"\n";
                var extra = Markup.inlineKeyboard([
                    Markup.callbackButton('< Previous', 'Previous'),
                    Markup.callbackButton('Graph', 'Graph'),
                    Markup.callbackButton('Next >', 'Next')]).extra();
                var mark = {parse_mode:"Markdown"};
                var j = Object.assign(mark,extra);
                ctx.reply(string,j)
                check(last)
            });
        })
        bot.action('Previous', (ctx) => {
            retrivePlant(elem.plantID, (err, result)=>{
                if(page<=0){
                    ctx.reply('no other information');
                    return;
                }
                page = page - 1;
                var last = result[page];
                var data=last.date.split(':');  // YYYY:MM:DD:HH:MM:SS
                var string = "This is the status on "+data[2]+"/" +data[1]+"/"+data[0] +" at " +data[3]+":"+data[4]+"\n";
                string += "\n*Light*: "+ last.light +"\n";
                string += "*PH*: "+ last.ph +"\n";
                string += "*Temperature*: "+ last.temperature +"\n";
                var extra = Markup.inlineKeyboard([
                    Markup.callbackButton('< Previous', 'Previous'),
                    Markup.callbackButton('Graph', 'Graph'),
                    Markup.callbackButton('Next >', 'Next')]).extra();
                var mark = {parse_mode:"Markdown"};
                var j = Object.assign(mark,extra);
                ctx.reply(string,j)
                check(last)
            });
        })
        bot.action('Graph', (ctx)=>{
            retrivePlant(elem.plantID, (err, result)=>{
                chart.setTitle('Status');
                var tmp =[]
                var ph =[]
                var light =[]
                var date =[]
                var k =0;
                // if(result.length>10)k=result.length-10;
                for (var i = 0; i < result.length; i++) {
                    var last = result[i];
                    var data=last.date.split(':');  // YYYY:MM:DD:HH:MM:SS
                    var string = i+" ";
                    date.push(string);

                    tmp.push(last.temperature)
                    ph.push(last.ph)
                    light.push(last.light)
                }
                chart.addData(tmp, 'Temperature', '008000');
                chart.addData(ph, 'PH', '0000FF');
                chart.addData(light, 'Light', 'FF0000');
                chart.addAxisLabels('x', date);
                chart.setAutoScaling();
                chart.setAxisRange('y', 0, 10, 1);
                chart.setWidth(670); //670
                chart.setHeight(446);
                // chart.setTransparentBackground();

                var imageUrl = chart.getUrl(true); // First param controls http vs. https

                // bot.telegram.sendMessage(ctx.chat.id,imageUrl, {parse_mode:"Markdown"});
                var s = "[graph]("+imageUrl+")"
                bot.telegram.sendMessage(ctx.chat.id, s,{parse_mode:"Markdown"})
            })
        })

        bot.command('/startsensor', (ctx) => {
            if(woody.info===undefined){
                 ctx.reply("Set your plant/flower first!");
                 return;
            }
            ok=false
            port.write("3", function(err) { //
                if (err) {
                    ctx.reply('error')
                    return console.log('Error on write: ', err.message);
                }
                console.log('message written');
                if(ok)
                    ctx.reply('Ok, I started the sensors')
                else
                    ctx.reply('Retry')

            });

        })

        bot.command('/info', (ctx) => {
            if(woody.info===undefined){
                 ctx.reply("Set your plant/flower first!");
                 return;
             }            var string ="";
            string += "*"+elem.plant+"* - "+ woody.botanical;
            const GoogleImages = require('google-images');
            const client = new GoogleImages(CSE_ID, API_KEY);
            client.search(woody.botanical)
              .then(images => {
                // console.log(images);
                if(images.length===0){
                    bot.telegram.sendMessage(ctx.chat.id,string,{parse_mode:"Markdown"})
                    // console.log(url);

                    string  = "\n*Light*: "+woody.info.light.description;
                    string += "\n*Water*: "+woody.info.water.description;
                    string += "\n*Soil PH*: "+woody.info.soilph.description;
                    bot.telegram.sendMessage(ctx.chat.id, string, {parse_mode:"Markdown"})
                    return;
                }
                var url = images[0].url;
                // console.log(url);
                // const download = require('image-downloader')
                // const options = {
                //     url: url,
                //     dest: './image.jpg'
                // }
                // download.image(options)
                //     .then(({filename,image}) => {

                // ctx.replyWithPhoto({ source: fs.createReadStream('./img.jpg')});
                // bot.telegram.sendPhoto(ctx.chat.id,  {source: fs.readFileSync("./img.jpg")},{caption:string, parse_mode:"Markdown"})
                bot.telegram.sendPhoto(ctx.chat.id,url,{caption:string, parse_mode:"Markdown"})
                // console.log(url);

                string  = "\n*Light*: "+woody.info.light.description;
                string += "\n*Water*: "+woody.info.water.description;
                string += "\n*Soil PH*: "+woody.info.soilph.description;
                bot.telegram.sendMessage(ctx.chat.id, string, {parse_mode:"Markdown"})

                // }).catch((err) => {
                //     console.log("erro download"+ err);
                // })
            });
        })

        bot.command('/setplant', (ctx) => {
            if(ctx.state.command.args === '') {
                ctx.reply("name of the plant or flower required \n/setplant plant_name");
                return;
            }
            wood_db.commonSearch(ctx.state.command.args, (err, result)=>{
                var string = "";
                for (var i = 0; i < result.length; i++) {
                    console.log(result[i]);
                    string = result[i].botanical+"\n";
                    if(result.link===undefined){
                        ctx.reply("no plant found");
                        break;
                    }
                    else{
                        ctx.reply(string, Markup.inlineKeyboard([
                            Markup.callbackButton('Set', 'Set '+string),
                        ]).extra());
                    }
                }
            })
        });
        bot.action(/Set (.*)/, (ctx) => {
            var b = ctx.update.callback_query.data.slice(4);
            console.log(b);
            wood_db.searchB(b, (err,result)=>{
                if(result===undefined) return
                console.log(result);
                elem.plant = result.name;
                elem.botanical = result.botanical;
                setPlant(elem)
                woody=result;
                ctx.reply("You set the plant as a " + elem.botanical);
            })
        })


        bot.command('/help', (ctx) => {
            ctx.reply('Welcome! This is Smart Plant.\nUse the commands to interact.')
            ctx.reply('use /key to use buttons')
        })


        bot.startPolling();

})


// setPlant(elem);
// retrivePlant(0,(err, res)=>{console.log(res);})
// addPlant(elem)


function leggi(){
    var x1 = "1,2,3" // commentare quando ci sarà la scheda vera
    // console.log(x1);
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
    if(woody.info===undefined) return;
    if(status.ph>woody.info.soilph.max){
        bot.telegram.sendMessage(chatId, "⚠️ PH too Basic!")
    }
    if(status.ph<woody.info.soilph.min){
        bot.telegram.sendMessage(chatId, "⚠️ PH too Acid!")
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

// set()
function set(){
    plants.set({plants:[{a:"b",status:[{a:"b"}]}]})
}
