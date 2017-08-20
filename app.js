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
var monitor = new bbqMonitor(false);

app.get('/', function (req, res) {
	res.render('index', {
		title: 'SmokerPi', 
		message: 'Welcome to SmokerPi.', 
	});
});

app.post('/', function (req, res) {
	monitor.newSession(function(data) {
		io.emit('updateTemp', data);
	},
	function(sessionId){
		res.redirect("dashboard/" + sessionId);
	});
});

app.get('/dashboard/:sessionId', function (req, res) {
	monitor.getSession(req.params.sessionId, function(data) {
		data = data || {startDate: "invalid sessionId", startTime: ""};
		res.render('dashboard', {
			title: 'SmokerPi', 
			message: data.startDate,
			currTemp: monitor.currTemp,
			targetTemp: monitor.targetTemp,
			isBlowerOn: monitor.isBlowerOn,
			blowerState: monitor.blowerState,
			sessionId: req.params.sessionId
		});
	});
});

app.get('/loadPastSessions', function(req, res) {
	monitor.getPastSessions(function(data) {
		res.json(data);
	});
});

app.get('/loadChartData/:sessionId', function(req, res) {
	monitor.getTemperatureLog(req.params.sessionId, function (data) {
		res.json(data);
	});
});

io.on('connection', function(socket){
	socket.on('setBlowerState', function(blowerState){
		monitor.blowerState = blowerState;
	});
});

server.listen(port, function(){
	console.log('listening on port ' + port);
});



