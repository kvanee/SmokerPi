const wifi = require('./wifi-mgr.js')();

wifi.connectNetwork('Fake', 'password').then(console.log).catch(console.log);
//wifi.findNetworks().then(console.log).catch(console.log);