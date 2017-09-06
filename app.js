var express = require('express');
var app = express();
var server = require('http').createServer(app);
var favicon = require('serve-favicon');
app.set('view engine', 'pug')
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(express.static('bower_components'));
app.use(express.static('public'));
var io = require('socket.io')(server);
var port = 3080;
var bbqMonitor = require('./bbqMonitor');
var monitor = new bbqMonitor(false, function(data) {
	io.emit('updateTemp', data);
});

app.get('/', function (req, res) {
	res.render('dashboard', {
		title: 'SmokerPi', 
		currTemp: monitor.currTemp,
		targetTemp: monitor.targetTemp,
		isBlowerOn: monitor.isBlowerOn,
		blowerState: monitor.blowerState,
		logState: monitor.logState,
		sessionName: monitor.sessionName
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
});

server.listen(port, function(){
	console.log('listening on port ' + port);
});



