//Max31865.js
/* based on https://github.com/adafruit/Adafruit_MAX31865
*  https://learn.adafruit.com/adafruit-max31865-rtd-pt100-amplifier/overview
*  https://www.npmjs.com/package/rpio
*  SCK - This is the SPI Clock pin, its an input to the chip
*  SDO - this is the Serial Data Out / Master In Slave Out pin, for data sent from the MAX31865 to your processor
*  SDI - this is the Serial Data In / Master Out Slave In pin, for data sent from your processor to the MAX31865
*  CS - this is the Chip Select pin, drop it low to start an SPI transaction. Its an input to the chip
*/
var debug = false;
var refResistor = 430,
		RTDnominal = 100,
		CONFIG_REG = 0x00,
		CONFIG_BIAS = 0x80,
		CONFIG_1SHOT = 0x20,
		CONFIG_3WIRE = 0x10,
		CONFIG_FAULTSTAT = 0x02,
		CONFIG_FILT50HZ = 0x01,
		CONFIG_FILT60HZ = 0x00,
		RTDMSB_REG = 0x01,
		RTD_A = 3.9083e-3,
		RTD_B = -5.775e-7;
		
function _oneShot() {
	//1Shot
	var config = _read8(CONFIG_REG);
	config |= CONFIG_1SHOT;
	_write(CONFIG_REG, config);
	rpio.msleep(65)
}

function _enableBias(b) {	
	//enable bias		
	var config = _read8(CONFIG_REG);
	if(b)
		config |= CONFIG_BIAS;
	else
		config &= ~CONFIG_BIAS;
		
	_write(CONFIG_REG, config);
	rpio.msleep(10)
}

function _write(address, value) {
	if (rpio === undefined)
		return;
	address |= 0x80 //Set Write Bit
	
	var tx = new Buffer([address, value]);
	var rx = new Buffer(tx.length)
	rpio.spiTransfer(tx, rx, tx.length); 
}

function _read8(address) {
	if (rpio === undefined)
		return;
	address &= 0x7F; //Ensure write bit is not set
	var tx = new Buffer([address, 0xFF]);
	var rx = new Buffer(tx.length)
	rpio.spiTransfer(tx, rx, tx.length); 
	return rx[1]
}

function _read16(address) {
	var tx = new Buffer([address, 0xFF, 0xFF]);
	var rx = new Buffer(tx.length)
	rpio.spiTransfer(tx, rx, tx.length);
	var msb = rx[1];
	var lsb = rx[2];
	return (msb <<8 ) + lsb; //combine msb and lsb
}

function clearFault() {
var config = _read8(CONFIG_REG);
  config |= CONFIG_FAULTSTAT;
  _write(CONFIG_REG, config);
}

calcTemp = function() {	
	_enableBias(true);
	_oneShot();
	
	var rtd = _read16(RTDMSB_REG);
	rtd >>=1; //remove fault bit
	if(debug)
		console.log("rtd: " + rtd);
	
	_enableBias(false);	
	
	var ratio = rtd / 32768;
	if(debug)
		console.log("ratio: " + ratio);
	var Rt = 430 * ratio;
	if(debug)
		console.log("resistance: " + Rt);
	
	Z1 = -RTD_A;
	Z2 = RTD_A * RTD_A - (4 * RTD_B);
	Z3 = (4 * RTD_B) / RTDnominal;
	Z4 = 2 * RTD_B;

	temp = Z2 + (Z3 * Rt);
	temp = (Math.sqrt(temp) + Z1) / Z4;

	if (temp >= 0) 
		return temp;
	
	var rpoly = Rt;
	temp = -242.02;
	temp += 2.2228 * rpoly;
	rpoly *= Rt;  // square
	temp += 2.5859e-3 * rpoly;
	rpoly *= Rt;  // ^3
	temp -= 4.8260e-6 * rpoly;
	rpoly *= Rt;  // ^4
	temp -= 2.8183e-8 * rpoly;
	rpoly *= Rt;  // ^5
	temp += 1.5243e-10 * rpoly;

	return temp;
};

function Max31865(cs) {	
	rpio = require('rpio');
	rpio.spiBegin();
	rpio.spiSetClockDivider(128);  /* Set SPI speed to 1.95MHz */
	rpio.spiSetDataMode(1);
	clearFault();
}

Max31865.prototype.calcTemp = calcTemp;

Max31865.prototype.calcTempF = function(cs) {
	rpio.spiChipSelect(cs);
	if(debug)
		console.log("Chip Select: " + cs);
	var temp = (((calcTemp() * 9) / 5) + 32);
	if(debug)
		console.log("temp: " + temp);
	return temp;
};

Max31865.prototype.init3Wire = function(cs) {
	rpio.spiChipSelect(cs);
	_write(CONFIG_REG, CONFIG_3WIRE);
};

module.exports = Max31865;
