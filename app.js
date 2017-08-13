//remote editing
//https://www.youtube.com/watch?v=RlgLIr2gZFg
//jmate https://github.com/jrnewell/jmate
//remote vscode
//(from windows) plink.exe -R 52698:127.0.0.1:52698 pi@192.168.1.168

var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.set('view engine', 'pug')
//app.use(express.static(__dirname + '/bower_components'));
app.use(express.static('bower_components'));
app.use(express.static('public'));
var io = require('socket.io')(server);
var Datastore = require('nedb'), 
	db = new Datastore({ filename: './logs.db', autoload: true});

//https://www.npmjs.com/package/rpio
var rpio = require('rpio');
//https://www.npmjs.com/package/date-and-time
var date = require('date-and-time');
var Max31865 = require('./Max31865');
//https://en.wikipedia.org/wiki/PID_controller
//https://www.npmjs.com/package/node-pid-controller
var Controller = require('node-pid-controller');
//https://www.npmjs.com/package/better-sqlite3
//var db = require('better-sqlite3');
//db.open('./database.sqlite');
var port = 3080;
var targetTemp = 230;
var interval = 10000; 
var pidC = new Controller({
  k_p: 0.5,
  k_i: 0.5,
  k_d: 0.5,
  dt: interval / 1000
});
pidC.setTarget(targetTemp/*target temp*/);
var thermometer = new Max31865(0/*SPI Device 0*/);
var currTemp = thermometer.calcTempF();
var blowerOn = false;
var blowerPin = 8;/*GPIO pin used to turn the blower on and off*/
rpio.open(blowerPin, rpio.OUTPUT, rpio.LOW);
//var stmt = db.prepare('INSERT INTO logs VALUES (@date, @time, @temp, @blower)');

app.get('/', function (req, res) {
	res.render('index', {
		title: 'SmokerPi', 
		message: 'Welcome to SmokerPi.', 
		currTemp: currTemp,
		targetTemp: targetTemp,
		blowerOn
	});
});

io.on('connection', function(socket){
  //console.log('a user connected');
  var now = new Date();
  db.find({ date: date.format(now, 'YYYY/MM/DD')}).sort({ time: 1 }).exec(function (err, data) {
	socket.emit("refreshChart", data)
  });
  socket.on('disconnect', function(){
    //console.log('user disconnected');
  });
});



server.listen(port, function(){
	console.log('listening on port ' + port);
});

//Check the temp and adjust the blower every interval
setInterval(function() {
	var now = new Date();
	blowerOn = false;
	currTemp = thermometer.calcTempF();
	//console.log("temp:" + currTemp);
		
	if (currTemp < targetTemp) {
		rpio.write(blowerPin, rpio.HIGH);
		blowerOn = true;
		//console.log("blowerOn: " + blowerOn);
	}
	else {
		rpio.write(blowerPin, rpio.LOW);
		blowerOn = false;
		//console.log("blowerOn: " + blowerOn);
		//var correction = pidC.update(currTemp);
		//console.log("correction: " + correction);
	}
	var data = {
    	date: date.format(now, 'YYYY/MM/DD'),
		time: date.format(now, 'HH:mm:ss'),
		currTemp: currTemp,
		targetTemp: targetTemp,
		blowerOn
    };
	io.emit('updateTemp', data);
	db.insert(data);
	//stmt.run(data);
}, interval);

