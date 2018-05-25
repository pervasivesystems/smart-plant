const GoogleImages = require('google-images');

const client = new GoogleImages('010334306050835713802:vhrzz0upnmu', 'AIzaSyB__gDxtMyOgMBMSvls7MqvHcRpmNBt_U4');

client.search('camelia japonica')
    .then(images => {
        /*
        [{
            "url": "http://steveangello.com/boss.jpg",
            "type": "image/jpeg",
            "width": 1024,
            "height": 768,
            "size": 102451,
            "thumbnail": {
                "url": "http://steveangello.com/thumbnail.jpg",
                "width": 512,
                "height": 512
            }
        }]
         */
         console.log(images);
    });

// // paginate results
// client.search('Steve Angello', {page: 2});
//
// // search for certain size
// client.search('Steve Angello', {size: 'large'});
