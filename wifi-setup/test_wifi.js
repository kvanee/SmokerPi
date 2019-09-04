const wifi = require('./wifi-setup.js')
//setInterval(() => {
wifi.isConnected().then(console.log).catch(console.log);
wifi.findNetworks().then(console.log).catch(console.log);
//}, 5000);