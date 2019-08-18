var express = require('express');
var expressLayouts = require('express-ejs-layouts')
var passport = require('passport');
var flash = require("connect-flash");
var session = require("express-session");
var date = require('date-and-time');
var fcmLib = require('./FCM/fcm');
var app = express();
const {
	authenticate: authenticate
} = require('./config/authenticate')

//Passport config
require('./config/passport')(passport);

//Create unsecure server
var server = require('http').createServer(app);

//Create Secure server
//https://medium.com/@yash.kulshrestha/using-lets-encrypt-with-express-e069c7abe625
//https://pimylifeup.com/raspberry-pi-ssl-lets-encrypt/
try {
	var fs = require('fs');
	var options = {
		key: fs.readFileSync('ssl/privkey.pem'),
		cert: fs.readFileSync('ssl/fullchain.pem')
	};
	var https = require('https');
	var sslserver = https.createServer(options, app);
} catch (err) {
	console.log("Warning, failed to create SSL server: " + err);
}
var favicon = require('serve-favicon');

//Use Pug
app.set('view engine', 'pug');

//Bodyparser
app.use(express.urlencoded({
	extended: false
}))

//Express Session
var sessionMiddleware = session({
	secret: 'deodorant',
	resave: true,
	saveUninitialized: true
});
app.use(
	sessionMiddleware
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

//globals
app.use((req, res, next) => {
	res.locals.success = req.flash('success');
	res.locals.errors = req.flash('error');
	next();
})

//Add favicon
app.use(favicon(__dirname + '/public/images/favicon.png'));

//Add static routes
app.use(express.static('bower_components'));
app.use(express.static('public'));

//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/session', authenticate, require('./routes/session'));

//FCM
var fcm = new fcmLib("https://smoker.kells.io/images/favicon.png");

//Socket.IO
require('./config/socket.io')(sslserver || server, sessionMiddleware, fcm);

//Redirect to secure server
app.use((req, res, next) => {
	if (req.secure) {
		next();
	} else if (sslserver) {
		res.redirect('https://' + req.headers.host + req.url);
	} else
		next();
});

//Direct home 401
app.get('*', function (req, res) {
	res.redirect('/');
});

app.get('/health-check', function (req, res) {
	res.sendStatus(200)
});
var port = 3080;
server.listen(port, function () {
	console.log('listening on port ' + port);
});
var sslport = 3443;
if (sslserver)
	sslserver.listen(sslport, function () {
		console.log('listening on port (ssl) ' + sslport);
	});