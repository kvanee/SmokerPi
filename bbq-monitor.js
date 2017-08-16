
var date = require('date-and-time');
var Max31865 = require('./Max31865');
//https://www.npmjs.com/package/rpio
var rpio = require('rpio');
var Datastore = require('nedb'), 
db = new Datastore({ filename: './logs.db', autoload: true});

function bbqMonitor() {	
    var period = 10000;/*Interval to check temp and adjust blower*/
    var interval = 0;
    var thermometer = new Max31865(0/*SPI Device 0*/);
    var blowerPin = 8;/*GPIO pin used to turn the blower on and off*/
    rpio.open(blowerPin, rpio.OUTPUT, rpio.LOW);

    this.targetTemp = 0;
	this.isBlowerOn = false;
	this.blowerState = "off"
	this.currTemp = thermometer.calcTempF();
	this.sessionId = 0;
}

bbqMonitor.prototype.newSession = function(callback) {
	if (sessionId)
		callback(sessionId);
	db.insert({
		startDate: date.format(now, 'YYYY/MM/DD'),
		startTime: date.format(now, 'HH:mm:ss')
	}, function (err, doc) { 
		callback(doc._id);
	});
}

bbqMonitor.prototype.start = function(sessionId, callback) {
	if(!this.sessionId) {
		this.sessionId = sessionId;
		interval = setInterval(this.monitorTemp(sessionId, callback), period);
	}
}
bbqMonitor.prototype.stop = function() {
    clearInterval(interval);
	interval = 0;
	this.sessionId = 0;
}

bbqMonitor.prototype.getTempLog = function(callback) {
    var now = new Date();
    db.find({ sessionId: sessionId}, function (err, data) {
        callback(err, data);
    });
}

bbqMonitor.prototype.monitorTemp = function(sessionId, callback) {
	var now = new Date();
	isBlowerOn = false;
	currTemp = thermometer.calcTempF();
	if(((currTemp < targetTemp) && blowerState == "auto") || blowerState == "on") {
		rpio.write(blowerPin, rpio.HIGH);
		isBlowerOn = true;
	}
	else {
		rpio.write(blowerPin, rpio.LOW);
		isBlowerOn = false;
	}
	var data = {
		sessionId: sessionId,
    	date: date.format(now, 'YYYY/MM/DD'),
		time: date.format(now, 'HH:mm:ss'),
		currTemp: currTemp,
		targetTemp: targetTemp,
		isBlowerOn
	};
	db.insert(data);
	callback(data);
}
