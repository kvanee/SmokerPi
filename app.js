var express = require('express');
var app = express();

//Create unsecure server
var server = require('http').createServer(app);

//Create Secure server
//https://medium.com/@yash.kulshrestha/using-lets-encrypt-with-express-e069c7abe625
//https://pimylifeup.com/raspberry-pi-ssl-lets-encrypt/
try {
	var fs = require('fs');
	var options = {
		key: fs.readFileSync('ssl/privkey.pem'),
		cert: fs.readFileSync( 'ssl/fullchain.pem')
	};
	var https = require('https');
	var sslserver = https.createServer(options, app);
} catch(err) {
	console.log("Warning, failed to create SSL server: " + err);
}
var favicon = require('serve-favicon');
app.set('view engine', 'pug')
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(express.static('bower_components'));
app.use(express.static('public'));
var io;
if(sslserver)
	io = require('socket.io')(sslserver);
else
	io = require('socket.io')(server);
var date = require('date-and-time');
var fcmLib = require('./FCM/fcm');
var fcm = new fcmLib("https://smoker.kells.io/images/favicon.png");
var inAlert = false;
var bbqMonitor = require('./bbqMonitor');
var auth = fs.readFileSync('password.txt', 'utf8');
console.log(auth);
var monitor = new bbqMonitor(false, function(data) {
	io.emit('updateTemp', data);
	if (data.currMeatTemp >= monitor.alertMeat) {
		if(!inAlert) {
			inAlert = true;
			fcm.sendMessage(
				'Cooking Done!!!', 
				'Meat Temperature: ' + data.currMeatTemp
			);
		}
	}
	else if(data.currBbqTemp > monitor.alertHigh || data.currBbqTemp < monitor.alertLow ) {
		if(!inAlert) {
			inAlert = true;
			fcm.sendMessage(
				'Temperature Alert', 
				'Smoker Temperature: ' + data.currBbqTemp
			);
		}
	}
	else if(inAlert) {
		inAlert = false;
	}
});

app.use(function(req, res, next) {
    if (req.secure) {
        next();
    } else if(sslserver) {
        res.redirect('https://' + req.headers.host + req.url);
	}
	else
		next();
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
	socket.on('setBlowerState', function(data){
		if(data.password.toLowerCase() === auth) {
			monitor.setBlowerState(monitor, data.blowerState);
			socket.broadcast.emit('setBlowerState', data.blowerState);
		}
	});
	socket.on('setLogState', function(data){
		if(data.password.toLowerCase() === auth) {
			monitor.setLogState(monitor, data.logState);
			socket.broadcast.emit('setLogState', data.logState);
		}
	});
	socket.on('saveSessionName', function(data){
		if(data.password.toLowerCase() === auth) {
			monitor.setSessionName(monitor, data.sessionName);
			socket.broadcast.emit('setSessionName', data.sessionName);
			socket.emit('setSessionName', data.sessionName);
		}
	});
	socket.on('saveSettings', function(data){
		if(data.password.toLowerCase() === auth) {
			monitor.setTargetTemp(monitor, data.targetTemp);
			monitor.setAlertHigh(monitor, data.alertHigh);
			monitor.setAlertLow(monitor, data.alertLow);
			monitor.setAlertMeat(monitor, data.alertMeat);
			socket.broadcast.emit('updateSettings', data);
		}
	});
	socket.on('getSettings', function(){
		socket.emit('updateSettings', {
			targetTemp: monitor.targetTemp,
			alertHigh: monitor.alertHigh,
			alertLow: monitor.alertLow,
			alertMeat: monitor.alertMeat
		});
	});
	socket.on('setFcmToken', function(token){
		console.log('FCM token set: ' + token);
		fcm.addFCMListener(token);
	});
});

app.get('/health-check', function(req, res) { res.sendStatus(200)});
var port = 3080;
server.listen(port, function(){
	console.log('listening on port ' + port);
});
var sslport = 3443;
if (sslserver)
	sslserver.listen(sslport, function(){
		console.log('listening on port (ssl) ' + sslport);
	});



