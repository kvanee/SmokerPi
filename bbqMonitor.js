
var date = require('date-and-time');
var Max31865 = require('./Max31865');
var thermometer;
//https://www.npmjs.com/package/rpio
var rpio;
var Datastore = require('nedb'), 
db = {}
db.sessions = new Datastore({ filename: './session.db', autoload: true});
db.sessionLogs = new Datastore({ filename: './logs.db', autoload: true});

function bbqMonitor(debug) {	
    var blowerPin = 8;/*GPIO pin used to turn the blower on and off*/
	if(debug) {
		thermometer = {
			calcTempF: function(){
				return 249;
			}
		};
		rpio = {
			open: function(a,b,c){},
			write: function(){}
		};
	}
	else {
		rpio = require('rpio');
		thermometer = new Max31865(0/*SPI Device 0*/);
	}
	rpio.open(blowerPin, rpio.OUTPUT, rpio.LOW);

    this.targetTemp = 0;
	this.isBlowerOn = false;
	this.blowerState = "off"
	this.currTemp = thermometer.calcTempF();
	this.sessionId = 0;
	this.period = 10000;/*Interval to check temp and adjust blower*/
	this.interval = 0;
}

bbqMonitor.prototype.stop = function() {
    clearInterval(this.interval);
	this.interval = 0;
	this.sessionId = 0;
}

bbqMonitor.prototype.getSession = function(sessionId, callback) {
	var now = new Date();
	sessionId = sessionId || this.sessionId;
    db.sessions.findOne({ _id: sessionId}, function (err, data) {
		if (err)
			throw err;
		callback(data);
    });
}

bbqMonitor.prototype.getPastSessions = function(callback) {
    var now = new Date();
	db.sessions.find({})
		.sort({startDate: 1}) 
		.limit(10)
		.exec(function (err, data) {
        callback(data);
    });
}

bbqMonitor.prototype.getTemperatureLog = function(sessionId, callback) {
    var now = new Date();
	db.sessionLogs.find({ sessionId: sessionId})
	.sort({ time: 1 })
	.exec(function (err, data) {
        callback(data);
    });
}

function monitorTemp(callback) {
	var now = new Date();
	isBlowerOn = false;
	this.currTemp = thermometer.calcTempF();
	if(((this.currTemp < this.targetTemp) && this.blowerState == "auto") || this.blowerState == "on") {
		rpio.write(this.blowerPin, rpio.HIGH);
		this.isBlowerOn = true;
	}
	else {
		rpio.write(this.blowerPin, rpio.LOW);
		this.isBlowerOn = false;
	}
	var data = {
		sessionId: this.sessionId,
    	date: date.format(now, 'YYYY/MM/DD'),
		time: date.format(now, 'HH:mm:ss'),
		currTemp: this.currTemp,
		targetTemp: this.targetTemp,
		isBlowerOn: this.isBlowerOn
	};
	db.sessionLogs.insert(data);
	callback(data);
}

bbqMonitor.prototype.newSession = function(update, callback) {
	if (this.sessionId)
		callback(this.sessionId);
	var now = new Date();
	var self = this;
	db.sessions.insert({
		startDate: date.format(now, 'YYYY/MM/DD'),
		startTime: date.format(now, 'HH:mm:ss')
	}, function (err, doc) { 
		self.sessionId = doc._id;
		self.interval = setInterval(function(){
			monitorTemp(update)
		}, self.period);
		callback(doc._id);
	});
}

bbqMonitor.prototype.monitorTemp = monitorTemp;

module.exports = bbqMonitor;