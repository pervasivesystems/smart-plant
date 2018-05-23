// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Text, Card, Image, Suggestion, Payload} = require('dialogflow-fulfillment');
const admin = require('firebase-admin');

var serviceAccount = require('./smart-plant-75235-firebase-adminsdk-pcxba-1c74fefac1.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smart-plant-75235.firebaseio.com/'
});
var db = admin.database();
var plants = db.ref("plants");

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome, this is Smart Plant! `);
        agent.add(new Suggestion('water the plant'));
        agent.add(new Suggestion('status of the plant'));
        agent.add(new Suggestion('info about the plant'));
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function water(agent) {
        agent.add(new Suggestion('help'));
        agent.add(new Card({
            title: "Click this",
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Rosa_Asagumo_1.jpg/220px-Rosa_Asagumo_1.jpg",
            text: 'To water the plant just click this button',
            buttonText: 'My server',
            buttonUrl: 'http://ip:3000/water'
          })
        );
    }

    function status(agent) {
        plants.once('value').then(snapshot => {
            // var json = snapshot.val();
            // var rose = json[0];
            // var string = rose.info[0].temperature
            // + ", " + rose.info[0].light
            // + ", " +rose.info[0].ph
            // agent.add(string);
            response.json({ 'fulfillmentText': 'output' });
        });
    }
    function help(agent) {
        agent.add(new Suggestion('water the plant'));
        agent.add(new Suggestion('status of the plant'));
        agent.add(new Suggestion('info about the plant'));
    }

    function info(agent) {
        agent.add(new Suggestion('help'));
        agent.add(new Card({
            title: "Rose",
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Rosa_Asagumo_1.jpg/220px-Rosa_Asagumo_1.jpg",
            text: 'A rose is a woody perennial flowering plant of the genus Rosa.',
            buttonText: 'Wikipedia Page',
            buttonUrl: 'https://en.wikipedia.org/wiki/Rose'
          })
        );
    }




  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', help);
  intentMap.set('Water Intent', water);
  intentMap.set('Status Intent', status);
  intentMap.set('Info Intent', info);
  // intentMap.set('help Intent', help);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
