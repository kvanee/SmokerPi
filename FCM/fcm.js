//FMC https://firebase.google.com/docs/cloud-messaging/
var fcmAdmin = require('firebase-admin');
var fs = require('fs');
var icon;

function fcm(i) {
	try {
		var serviceAccount = JSON.parse(fs.readFileSync("FCM/serviceAccountKey.json"));
		fcmAdmin.initializeApp({
			credential: fcmAdmin.credential.cert(serviceAccount),
			databaseURL: 'https://smokerpi-bcb83.firebaseio.com'
		});
	} catch(err) {
		console.log("Warning, failed to initialize FCM: " + err);
	}
	this.fcmTokens = [];	
	this.icon = i;
}

fcm.prototype.sendMessage = function(title, body, icon) {	
	// Send a message to the device corresponding to the provided
	// registration token.
	var goodTokens = [];
	this.fcmTokens.forEach(function(fcmToken) {
		try {			
			var message = {				
					token: fcmToken,
					webpush: {
						notification: {
							title: title,
							body: body,
							icon: this.icon
						}
					}
				};		
			fcmAdmin.messaging().send(message);
			goodTokens.push(fcmToken);
		} catch(error){
			console.log('Error sending message:', error);
		};
	});
	this.fcmTokens = goodTokens;
}

fcm.prototype.addFCMListener = function(token) {
	this.fcmTokens.push(token);
}

module.exports = fcm;