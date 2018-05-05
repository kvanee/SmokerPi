//FMC https://firebase.google.com/docs/cloud-messaging/
var fcmAdmin = require('firebase-admin');
var fs = require('fs');


var serviceAccount = JSON.parse(fs.readFileSync("FCM/serviceAccountKey.json"));
fcmAdmin.initializeApp({
	credential: fcmAdmin.credential.cert(serviceAccount),
	databaseURL: 'https://smokerpi-bcb83.firebaseio.com'
});


exports.sendMessage = function(msg) {
	// Send a message to the device corresponding to the provided
	// registration token.
	fcmAdmin.messaging().send(msg)
	  .catch((error) => {
		console.log('Error sending message:', error);
	});
	
}
