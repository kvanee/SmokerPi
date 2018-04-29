var express = require('express');
var app = express();

//Create unsecure server
var server = require('http').createServer(app);

//Create Secure server
//https://medium.com/@yash.kulshrestha/using-lets-encrypt-with-express-e069c7abe625
//https://pimylifeup.com/raspberry-pi-ssl-lets-encrypt/
var fs = require('fs');
var options = {
	key: fs.readFileSync('ssl/privkey.pem'),
	cert: fs.readFileSync( 'ssl/fullchain.pem')
};
var https = require('https');
var sslserver = https.createServer(options, app);
var favicon = require('serve-favicon');
app.set('view engine', 'pug')
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(express.static('bower_components'));
app.use(express.static('public'));
var io = require('socket.io')(sslserver);
var dateTime = require('node-datetime');
var fcm = require('./FCM/fcm');
var fcmToken;//currently supports a single notification client.
var inAlert = false;
var bbqMonitor = require('./bbqMonitor');
var monitor = new bbqMonitor(false, function(data) {
	io.emit('updateTemp', data);
	if(data.currBbqTemp > monitor.alertHigh || data.currBbqTemp < monitor.alertLow ) {
		if(!inAlert && fcmToken) {
			inAlert = true;
			var dt = dateTime.create();
			var formatted = dt.format('H:M:S');
			
			var message = {
				token: fcmToken,
				notification: {
					title: 'Temperature Alert',
					body: formatted +'-temperature: ' + data.currBbqTemp//,
					//icon: "https://smoker.kells.io/images/favicon.png"//"/public/images/favicon.png"
			  }			  
			};			
			fcm.sendMessage(message);
		}
	}
	else if(inAlert) {
		inAlert = false;
	}
});

app.use(function(req, res, next) {
    if (req.secure) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

app.get('/', function (req, res) {
	res.render('dashboard', {
		title: 'SmokerPi', 
		currBbqTemp: monitor.currBbqTemp,
		currMeatTemp: monitor.currMeatTemp,
		targetTemp: monitor.targetTemp,
		isBlowerOn: monitor.isBlowerOn,
		blowerState: monitor.blowerState,
		logState: monitor.logState,
		sessionName: monitor.sessionName,
		alertHigh: monitor.alertHigh,
		alertLow: monitor.alertLow,
		alertMeat: monitor.alertMeat
	});
});

app.get('/loadPastSessions', function(req, res) {
	monitor.getPastSessions(function(data) {
		res.json(data);
	});
});

app.get('/loadChartData/:sessionName', function(req, res) {
	monitor.getTemperatureLog(req.params.sessionName, function (data) {
		res.json(data);
	});
});

io.on('connection', function(socket){
	socket.on('setBlowerState', function(blowerState){
		monitor.setBlowerState(monitor, blowerState);
		socket.broadcast.emit('setBlowerState', blowerState);
	});
	socket.on('setLogState', function(logState){
		monitor.setLogState(monitor, logState);
		socket.broadcast.emit('setLogState', logState);
	});
	socket.on('setSessionName', function(SessionName){
		monitor.setSessionName(monitor, SessionName);
		socket.broadcast.emit('setSessionName', SessionName);
	});
	socket.on('setTargetTemp', function(targetTemp){
		monitor.setTargetTemp(monitor, targetTemp);
		socket.broadcast.emit('setTargetTemp', targetTemp);
	});
	socket.on('setAlertHigh', function(value){
		monitor.setAlertHigh(monitor, value);
		socket.broadcast.emit('setAlertHigh', value);
	});
	socket.on('setAlertLow', function(value){
		monitor.setAlertLow(monitor, value);
		socket.broadcast.emit('setAlertLow', value);
	});
	socket.on('setAlertMeat', function(value){
		monitor.setAlertMeat(monitor, value);
		socket.broadcast.emit('setAlertMeat', value);
	});
	socket.on('setFcmToken', function(token){
		console.log('token set');
		fcmToken = token;
	});
});

app.get('/health-check', function(req, res) { res.sendStatus(200)});
var port = 3080;
server.listen(port, function(){
	console.log('listening on port ' + port);
});
var sslport = 3443;
sslserver.listen(sslport, function(){
	console.log('listening on port (ssl) ' + sslport);
});



