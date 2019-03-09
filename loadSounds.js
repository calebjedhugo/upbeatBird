/*This is a utility that updates the sounds.json file in the public folder.
In production, the games gets the sounds from a PHP webservice not include here.
Only Caleb has access to this database, but the 64 bit binary strings can be found
in client/public/sounds.json.*/

var express = require('express');
var app = express();
var mysql = require('mysql');
var os = require("os");
var path = require("path")
var hostname = os.hostname();
var devOrProdHost = hostname === "calebhugosimac.domain" ? "calebhugo.com" : "localhost";
var fs = require('fs')
var bodyParser = require('body-parser')
var password = require('../passwords.json').sounds

app.use(bodyParser.urlencoded({
    parameterLimit: 1000000000,
    limit: "1000mb",
    extended: false}))
app.use(bodyParser.json())

app.get('/upbeatSounds', function(req, res){
    var upbeatSounds = {};
    var connection = mysql.createConnection({
      host     : devOrProdHost,
      user     : credentials.username,
      password : credentials.password,
      database : 'calebh6_main'
    });
    connection.connect()
    connection.query("SELECT name, soundBinary FROM gameSounds WHERE game1='upbeatBird'",
        function(err, rows, fields){
            if(err) return console.log(err);
            rows.forEach(row => upbeatSounds[row.name] = row.soundBinary);
            res.json(upbeatSounds);
        })
    connection.end();
})

app.post('/saveSounds', function(req, res){
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    fs.readFile('./client/public/sounds.json', 'utf8', function(err, data){
        if(err) console.log(err.message);
        if(data !== req.body.soundString || err){
            fs.writeFile('./client/public/sounds.json', req.body.soundString, function(err){
                if(err) return console.log(err)
                console.log('New sounds have been saved!')
                res.json('New sounds have been saved!')
            })
        }
        else res.json('Sounds were up to date. No update needed.')
    })
})

app.listen(3001, () => console.log('loadSounds is listening on port 3001!'))
