var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('secret.txt')
});

lineReader.on('line', function (line) {
  console.log('Line from file:', line);
});
