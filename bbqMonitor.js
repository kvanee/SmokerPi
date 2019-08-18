var date = require('date-and-time');
var Max31865 = require('./Max31865');
var thermometer;
//https://www.npmjs.com/package/rpio
var rpio;
var db = require("./DataStore/datastore");

function bbqMonitor(debug) {
	if (debug) {
		this.debugMeatTemp = 70;
		thermometer = {
			calcTempF: function (cs) {
				if (!cs)
					return 245 + (Math.random() * 10.0);
				else
					return 80;
			}
		};
		rpio = {
			open: function (a, b, c) {},
			write: function () {}
		};
	} else {
		rpio = require('rpio');
		thermometer = new Max31865();
		thermometer.init3Wire(0 /*SPI Device 0*/ );
		thermometer.init3Wire(1 /*SPI Device 1*/ );
	}
	this.blowerPin = 8; /*GPIO pin used to turn the blower on and off*/
	this.targetTemp = 230;
	this.alertHigh = 245;
	this.alertLow = 225;
	this.alertMeat = 195;
	this.isBlowerOn = false;
	this.blowerState = "off"
	this.logState = "off"
	this.currBbqTemp = thermometer.calcTempF(0 /*SPI Device 0*/ ).toFixed(1);
	this.currMeatTemp = thermometer.calcTempF(1 /*SPI Device 1*/ ).toFixed(1);
	var now = new Date();
	this.sessionName = date.format(now, 'YYYY-MM-DD') + "-Meat";
	this.period = 1000; /*Interval to check temp and adjust blower*/
	this.handlers = [];
	rpio.open(this.blowerPin, rpio.OUTPUT, rpio.LOW);
}

bbqMonitor.prototype = {
	setBlowerState: function (blowerState) {
		this.blowerState = blowerState;
		if (((self.currBbqTemp < self.targetTemp) && self.blowerState == "auto") || self.blowerState == "on") {
			rpio.write(this.blowerPin, rpio.HIGH);
			this.isBlowerOn = true;
		} else {
			rpio.write(this.blowerPin, rpio.LOW);
			this.isBlowerOn = false;
		}

	},

	setLogState: function (self, logState) {
		this.logState = logState;
	},
	setSessionName: function (sessionName) {
		this.sessionName = sessionName;
	},
	setTargetTemp: function (value) {
		this.targetTemp = value;
	},
	setAlertHigh: function (value) {
		this.alertHigh = value;
	},
	setAlertLow: function (value) {
		this.alertLow = value;
	},
	setAlertMeat: function (value) {
		this.alertMeat = value;
	},
	getPastSessions: function (callback) {
		//TODO: neDB does not support Distinct, so must save sessionNames separately. 
		var now = new Date();
		db.sessions.find({})
			.sort({
				startDate: 1
			})
			.limit(10)
			.exec(function (err, data) {
				callback(data);
			});
	},
	getTemperatureLog: function (sessionName, callback) {
		var now = new Date();
		db.sessionLogs.find({
				sessionName: sessionName
			})
			.sort({
				date: 1,
				time: 1
			})
			.exec(function (err, data) {
				callback(data);
			});
	},
	subscribe: function (fn) {
		this.handlers.push(fn);
	},
	fire: function (self, data) {
		self.handlers.forEach((item) => {
			item.call(self, data);
		});
	},
	monitorTemp: function (self, callback) {
		var now = new Date();
		isBlowerOn = false;
		self.currBbqTemp = thermometer.calcTempF(0 /*SPI Device 0*/ ).toFixed(1);
		self.currMeatTemp = thermometer.calcTempF(1 /*SPI Device 1*/ ).toFixed(1);
		if (((self.currBbqTemp < self.targetTemp) && self.blowerState == "auto") || self.blowerState == "on") {
			rpio.write(self.blowerPin, rpio.HIGH);
			self.isBlowerOn = true;
		} else {
			rpio.write(self.blowerPin, rpio.LOW);
			self.isBlowerOn = false;
		}
		var data = {
			sessionName: self.sessionName,
			date: date.format(now, 'YYYY/MM/DD'),
			time: date.format(now, 'HH:mm:ss'),
			currBbqTemp: self.currBbqTemp,
			currMeatTemp: self.currMeatTemp,
			targetTemp: self.targetTemp,
			isBlowerOn: self.isBlowerOn
		};
		if (self.logState == "on") {
			db.sessionLogs.insert(data);
		}
		callback(self, data);
	},
}

var monitor = new bbqMonitor(false);
monitor.isSessionStarted = false;
monitor.interval = setInterval(function () {
	monitor.monitorTemp(monitor, monitor.fire);
}, monitor.period);

module.exports = monitor;