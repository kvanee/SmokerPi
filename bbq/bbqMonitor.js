const date = require('date-and-time');
const Max31865 = require('./Max31865');
const db = require("../DataStore/datastore");
const blowerPin = 8;
const DEBUG = true;

//https://www.npmjs.com/package/rpio
let rpio;
let thermometer;
let debugMeatTemp = 70;
const BBQMonitorSingleton = (function () {
	let instance;
	class BBQMonitor {
		constructor(debug) {
			if (!debug) {
				rpio = require('rpio');
				rpio.init({
					gpiomem: false
				});
				rpio.open(blowerPin, rpio.OUTPUT, rpio.LOW);
				thermometer = new Max31865();
				//initialize BBQ thermometer
				thermometer.init3Wire(0 /*SPI Device 0*/ );
				//initialize Meat thermometer
				thermometer.init3Wire(1 /*SPI Device 1*/ );
			} else
				this.setupDebug();

			/*Interval to check temp and adjust blower*/
			const period = 1000;
			this.handlers = [];
			this.sessionName = date.format(new Date(), 'YYYY-MM-DD') + "-Meat";
			this.targetTemp = 230;
			this.alertHigh = 245;
			this.alertLow = 225;
			this.alertMeat = 195;
			this.isBlowerOn = false;
			this.blowerState = "off";
			this.logState = "off";
			this.currBbqTemp = thermometer.calcTempF(0 /*SPI Device 0*/ );
			this.currMeatTemp = thermometer.calcTempF(1 /*SPI Device 1*/ );
			this.isSessionStarted = false;
			let self = this;
			setInterval(() => {
				this.monitorTemp(self)
			}, period);
		}

		setupDebug() {
			console.log("running in debug mode")
			thermometer = {
				calcTempF: function (cs) {
					if (!cs)
						return 245 + (Math.random() * 10.0);
					else
						return debugMeatTemp += Math.random();
				}
			};
			rpio = {
				write: function () {}
			};
		}

		updateBlowerGPIO() {
			if (((this.currBbqTemp < this.targetTemp) && this.blowerState == "auto") || this.blowerState == "on") {
				rpio.write(blowerPin, rpio.HIGH);
				this.isBlowerOn = true;
			} else {
				rpio.write(blowerPin, rpio.LOW);
				this.isBlowerOn = false;
			}
		}

		async getTemperatureLog(sessionName) {
			return db.sessionLogs.find({
					sessionName
				})
				.sort({
					date: 1,
					time: 1
				});
		}

		//TODO: neDB does not support Distinct, so must save sessionNames separately.
		async getPastSessions(callback) {
			let now = new Date();
			data = await db.sessions.find({})
				.sort({
					startDate: 1
				})
				.limit(10);
			callback(data);
		}

		subscribe(fn) {
			this.handlers.push(fn);
		}

		monitorTemp(self) {
			self.currBbqTemp = thermometer.calcTempF(0 /*SPI Device 0*/ );
			self.currMeatTemp = thermometer.calcTempF(1 /*SPI Device 1*/ );
			self.updateBlowerGPIO();
			let now = new Date();
			let data = {
				sessionName: self.sessionName,
				date: date.format(now, 'YYYY/MM/DD'),
				time: date.format(now, 'HH:mm:ss'),
				logState: self.logState,
				currBbqTemp: self.currBbqTemp.toFixed(1),
				currMeatTemp: self.currMeatTemp.toFixed(1),
				targetTemp: self.targetTemp,
				isBlowerOn: self.isBlowerOn
			};
			if (self.logState == "on") {
				db.sessionLogs.insert(data);
			}
			self.handlers.forEach((subscriber) => {
				subscriber(data);
			});
		}
	};
	return {
		getInstance: function () {
			if (!instance) {
				instance = new BBQMonitor(DEBUG);
			}
			return instance;
		}
	}
})();

module.exports = BBQMonitorSingleton.getInstance();