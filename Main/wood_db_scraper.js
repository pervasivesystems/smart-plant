var cheerio = require('cheerio')
var request = require('request');


function commonSearch(commonname, callback) {
    var woodsearch = "http://woodyplants.cals.cornell.edu/plant/index?PlantSearch%5BbotanicalName%5D=&PlantSearch%5BcommonName%5D=" + commonname + "&PlantSearch%5Bsize%5D=&PlantSearch%5Bleaves%5D=&PlantSearch%5Bleaves%5D=&PlantSearch%5Blight%5D=&PlantSearch%5BhardyToZone%5D=0&PlantSearch%5BsoilPh%5D=&PlantSearch%5BsoilPh%5D=&PlantSearch%5BsaltTolerance%5D=&PlantSearch%5BcuStructuralSoil%5D=&PlantSearch%5BmoistureCategory%5D=&PlantSearch%5BbareRootTransplanting%5D=&PlantSearch%5BbareRootTransplanting%5D=&PlantSearch%5Bcollection%5D=";
    request(woodsearch, function(error, response, body) {
        if(error){
            callback(error,null);
            return;
        }
        var $ = cheerio.load(body);
        var elements = $('tbody').children();
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var elem = elements.eq(i);
            var img = elem.children().eq(0).children().eq(0).attr("src");
            var link = elem.children().eq(1).children().eq(0).attr("href");
            var botanical = elem.children().eq(1).text();
            var name = elem.children().eq(2).text();
            result.push({
                "img": img,
                "link": link,
                "botanical": botanical,
                "name": name
            });
        }
        callback(null, result);
    });
}

function botanicSearch(botanicname, callback) {
    var woodsearch = "http://woodyplants.cals.cornell.edu/plant/index?PlantSearch%5BbotanicalName%5D="+botanicname+"&PlantSearch%5BcommonName%5D=&PlantSearch%5Bsize%5D=&PlantSearch%5Bleaves%5D=&PlantSearch%5Bleaves%5D=&PlantSearch%5Blight%5D=&PlantSearch%5BhardyToZone%5D=0&PlantSearch%5BsoilPh%5D=&PlantSearch%5BsoilPh%5D=&PlantSearch%5BsaltTolerance%5D=&PlantSearch%5BcuStructuralSoil%5D=&PlantSearch%5BmoistureCategory%5D=&PlantSearch%5BbareRootTransplanting%5D=&PlantSearch%5BbareRootTransplanting%5D=&PlantSearch%5Bcollection%5D=";
    request(woodsearch, function(error, response, body) {
        if(error){
            callback(error,null);
            return;
        }
        var $ = cheerio.load(body);
        var elements = $('tbody').children();
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var elem = elements.eq(i);
            var img = elem.children().eq(0).children().eq(0).attr("src");
            var link = elem.children().eq(1).children().eq(0).attr("href");
            var botanical = elem.children().eq(1).text();
            var name = elem.children().eq(2).text();
            result.push({
                "img": img,
                "link": link,
                "botanical": botanical,
                "name": name
            });
        }
        callback(null, result);
    });
}

function findInfo(plant, callback) {
    var url = "http://woodyplants.cals.cornell.edu" + plant;
    request(url, function(error, response, body) {
        if(error){
            callback(error,null);
            return;
        }
        var $ = cheerio.load(body);
        var details = $('.details').eq(2);
        var light, soilph, water;
        for (var i = 0; i < details.children().length; i++) {
            var el = details.children().eq(i).text();
            if(el.indexOf("Light:")>=0){
                light = el.split('Light:')[1].trim();
            }
            if(el.indexOf("Soil Ph:")>=0)
                soilph = el.split('Soil Ph:')[1].trim();
            if(el.indexOf("Moisture Tolerance:")>=0)
                water = el.split('Moisture Tolerance:')[1].split('See graphic below')[0].trim();
        }
        var light1=false, light2=false, light3=false;
        if(light.indexOf("Full sun")>=0)
            light1=true;
        if(light.indexOf("Part shade")>=0)
            light2=true;
        if(light.indexOf("Shade")>=0)
            light3=true;
        var PHmin = soilph.split('(')[1].replace('pH ','').replace(')','').split(' to ')[0];
        var PHmax = soilph.split('(')[1].replace('pH ','').replace(')','').split(' to ')[1];
        var water1=false, water2=false, water3=false, water4=false;
        if(water.indexOf("Occasionally saturated or very wet soil">0))
            water1=true;
        if(water.indexOf("Consistently moist, well-drained soil">0))
            water2=true;
        if(water.indexOf("Occasional periods of dry soil">0))
            water3=true;
        if(water.indexOf("Prolonged periods of dry soil">0))
            water4=true;

        var result = {light:{}, soilph:{}, water:{}};
        result.light.sun = light1;
        result.light.medium = light2;
        result.light.shade = light3;
        result.light.description = light;

        result.soilph.min = PHmin;
        result.soilph.max = PHmax;
        result.soilph.description = soilph;

        result.water.wet = water1;
        result.water.medium_wet = water2;
        result.water.medium_dry = water3;
        result.water.dry = water4;
        result.water.description = water;
        callback(null, result);
    });
}

function search(commonname, callback){
    commonSearch(commonname, (err, result)=>{
        findInfo(result[0].link, callback);
    });
}

exports.commonSearch = commonSearch;
exports.botanicSearch = botanicSearch;
exports.findInfo = findInfo;
exports.search = search;
