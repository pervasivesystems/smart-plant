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
