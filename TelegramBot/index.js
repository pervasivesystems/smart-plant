const TeleBot = require('telebot');
var bot;
var fs = require('fs');
var path = require('path');
var readStream = fs.createReadStream(path.join(__dirname) + '/telegram_bot_token.txt', 'utf8');
let token = ''
readStream.on('data', function(chunk) {
    token += chunk;
}).on('end', function() {
    console.log(token);
    bot = new TeleBot(token);

    bot.on('text', (msg) => msg.reply.text(msg.text));

    bot.start();

});
