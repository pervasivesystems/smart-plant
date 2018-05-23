const {
  dialogflow,
  BasicCard,
  BrowseCarousel,
  BrowseCarouselItem,
  Button,
  Carousel,
  Image,
  LinkOutSuggestion,
  List,
  MediaObject,
  Suggestions,
  SimpleResponse,
  Table,
 } = require('actions-on-google');
const functions = require('firebase-functions');
const app = dialogflow({debug: true});
const admin = require('firebase-admin');
var serviceAccount = require('./smart-plant-75235-firebase-adminsdk-pcxba-1c74fefac1.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smart-plant-75235.firebaseio.com/'
});
var db = admin.database();
var plants = db.ref("plants");

const intentSuggestions = [
  'water the plant',
  'status of the plant',
  'info about the plant'
];

app.intent('Default Welcome Intent', (conv) => {
  conv.close('Welcome, this is Smart Plant!');
  conv.ask(new Suggestions(intentSuggestions));
});

app.intent('Status Intent', (conv) => {
    plants.once("value", function(snapshot) {
        conv.ask(new Suggestions(intentSuggestions));
    })
});

app.intent('Water Intent', (conv) => {
    conv.ask(new LinkOutSuggestion({
     name: 'Suggestion Link',
     url: 'https://assistant.google.com/',
   }));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
