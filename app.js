const express = require('express');
const passport = require('passport');
const flash = require("connect-flash");
const session = require("express-session");
const fcmLib = require('./FCM/fcm');
const app = express();
const {
	authenticate: authenticate
} = require('./config/authenticate')


//Passport config
require('./config/passport')(passport);

//Create unsecure server
const server = require('http').createServer(app);
let sslserver;
//Create Secure server
//https://medium.com/@yash.kulshrestha/using-lets-encrypt-with-express-e069c7abe625
//https://pimylifeup.com/raspberry-pi-ssl-lets-encrypt/
try {
	const fs = require('fs');
	const options = {
		key: fs.readFileSync('ssl/privkey.pem'),
		cert: fs.readFileSync('ssl/fullchain.pem')
	};
	const https = require('https');
	sslserver = https.createServer(options, app);
} catch (err) {
	console.log("Warning, failed to create SSL server: " + err);
}
const favicon = require('serve-favicon');

//Use Pug
app.set('view engine', 'pug');

//Bodyparser
app.use(express.urlencoded({
	extended: false
}))

//Express Session
const sessionMiddleware = session({
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
app.use(express.static('public'));

// Enable WiFi Setup if connection is not available
require('./config/wifi-setup')(app, server);

//Routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/session', authenticate, require('./routes/session'));

//Direct home on 401
app.get('*', function (req, res) {
	res.redirect('/');
});

//FCM
const fcm = new fcmLib("https://smoker.kells.io/images/favicon.png");

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

app.get('/health-check', function (req, res) {
	res.sendStatus(200)
});

const port = 80;
server.listen(port, function () {
	console.log('listening on port ' + port);
});

const sslport = 3443;
if (sslserver)
	sslserver.listen(sslport, function () {
		console.log('listening on port (ssl) ' + sslport);
	});