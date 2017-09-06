
var date = require('date-and-time');
var Max31865 = require('./Max31865');
var thermometer;
//https://www.npmjs.com/package/rpio
var rpio;
var Datastore = require('nedb'), 
db = {}
db.sessions = new Datastore({ filename: './session.db', autoload: true});
db.sessionLogs = new Datastore({ filename: './logs.db', autoload: true});

function bbqMonitor(debug, callback) {	
    if(debug) {
		thermometer = {
			calcTempF: function(){
				return 250 + (Math.random() * 10.0);
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
	this.blowerPin = 8;/*GPIO pin used to turn the blower on and off*/
	this.targetTemp = 250;
	this.isBlowerOn = false;
	this.blowerState = "off"
	this.logState = "off"
	this.currTemp = thermometer.calcTempF();
	var now = new Date();
	this.sessionName = date.format(now, 'YYYY-MM-DD') + "-Meat";
	this.period = 10000;/*Interval to check temp and adjust blower*/
	rpio.open(this.blowerPin, rpio.OUTPUT, rpio.LOW);
	var self = this;
	this.interval = setInterval(function(){
		monitorTemp(self, callback);
	},self.period);
}

bbqMonitor.prototype.setBlowerState = function(self, blowerState) {
	self.blowerState = blowerState;
	if(((self.currTemp < self.targetTemp) && self.blowerState == "auto") || self.blowerState == "on") {
		rpio.write(this.blowerPin, rpio.HIGH);
		this.isBlowerOn = true;
	}
	else {
		rpio.write(this.blowerPin, rpio.LOW);
		this.isBlowerOn = false;
	}
	
}

bbqMonitor.prototype.setLogState = function(self, logState) {
	self.logState = logState;
}

bbqMonitor.prototype.setSessionName = function(self, sessionName) {
	self.sessionName = sessionName;
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

bbqMonitor.prototype.getTemperatureLog = function(sessionName, callback) {
    var now = new Date();
	db.sessionLogs.find({ sessionName: sessionName})
	.sort({ date: 1, time: 1 })
	.exec(function (err, data) {
        callback(data);
    });
}

function monitorTemp(self, callback) {
	var now = new Date();
	isBlowerOn = false;
	self.currTemp = thermometer.calcTempF().toFixed(1);
	if(((self.currTemp < self.targetTemp) && self.blowerState == "auto") || self.blowerState == "on") {
		rpio.write(self.blowerPin, rpio.HIGH);
		self.isBlowerOn = true;
	}
	else {
		rpio.write(self.blowerPin, rpio.LOW);
		self.isBlowerOn = false;
	}
	var data = {
		sessionName: self.sessionName,
		date: date.format(now, 'YYYY/MM/DD'),
		time: date.format(now, 'HH:mm:ss'),
		currTemp: self.currTemp,
		targetTemp: self.targetTemp,
		isBlowerOn: self.isBlowerOn
	};
	if(self.logState == "on") {
		db.sessionLogs.insert(data);
		callback(data);
	}
}

bbqMonitor.prototype.monitorTemp = monitorTemp;

module.exports = bbqMonitor;