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

var stub = function() {
	return {
		currTemp: 249,
		targetTemp: 205,
		isBlowerOn: true,
		blowerState: "auto",
		start: function(){},
		stop: function(){},
		getTempLog: function(){},
		newSession: function(callback) {callback(1);}
	}
}();
//var bbqMonitor = require('bbq-monitor')();
var bbqMonitor = stub;

app.get('/', function (req, res) {
	res.render('index', {
		title: 'SmokerPi', 
		message: 'Welcome to SmokerPi.', 
	});
});

app.post('/', function (req, res) {
	bbqMonitor.newSession(function(sessionId){
		res.redirect("dashboard/"+sessionId);
	});
});

app.get('/dashboard/:sessionId', function (req, res) {
	bbqMonitor.start(req.params.sessionId, function() {
		io.emit('updateTemp', data);
	});
	res.render('dashboard', {
		title: 'SmokerPi', 
		currTemp: bbqMonitor.currTemp,
		targetTemp: bbqMonitor.targetTemp,
		isBlowerOn: bbqMonitor.isBlowerOn,
		blowerState: bbqMonitor.blowerState
	});
});

io.on('connection', function(socket){
  bbqMonitor.getTempLog(function (err, data) {
		socket.emit("refreshChart", data)
	});
  socket.on('setBlowerState', function(blowerState){
		bbqMonitor.blowerState = blowerState;
	});
});

server.listen(port, function(){
	console.log('listening on port ' + port);
});



