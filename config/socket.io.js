const db = require("../DataStore/datastore");
const validate = require("validate.js");
const sessionConstraints = require('../validation/session');
const monitor = require('../bbq/bbqMonitor');
let inAlert = false;

module.exports = function (server, sessionMiddleware, fcm) {
    const io = require('socket.io')(server);
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    function handleMonitorEvent(data) {
        if (typeof data != 'undefined') {
            io.emit('updateTemp', data);
            if (data.currMeatTemp >= monitor.alertMeat) {
                if (!inAlert) {
                    inAlert = true;
                    fcm.sendMessage(
                        'Cooking Done!!!',
                        'Meat Temperature: ' + data.currMeatTemp
                    );
                }
            } else if (data.currBbqTemp > monitor.alertHigh || data.currBbqTemp < monitor.alertLow) {
                if (!inAlert) {
                    inAlert = true;
                    fcm.sendMessage(
                        'BBQ Temperature Alert',
                        'Smoker Temperature: ' + data.currBbqTemp
                    );
                }
            } else if (inAlert) {
                inAlert = false;
            }
        }
    }
    monitor.subscribe(handleMonitorEvent);

    io.on('connection', async (socket) => {
        let user = {};
        try {
            if (socket.request.session.passport) {
                id = socket.request.session.passport.user;
                user = await db.users.findOne({
                    email: id
                });
            }
        } catch (err) {
            //swallow exception
            //console.log(err)
        }
        socket.on('setBlowerState', (data) => {
            if (user.isAdmin) {
                monitor.blowerState = data.blowerState;
                socket.broadcast.emit('setBlowerState', monitor.blowerState);
            }
        });
        socket.on('setLogState', (data) => {
            if (user.isAdmin) {
                monitor.logState = data.logState;
                socket.broadcast.emit('setLogState', data.logState);
            }
        });
        socket.on('saveSessionName', (data) => {
            const sessionNameConstraints = {
                sessionName
            } = sessionConstraints;
            let validationErrors = validate(session, sessionNameConstraints)
            if (user.isAdmin && !validationErrors) {
                monitor.sessionName = data.sessionName;
                socket.broadcast.emit('setSessionName', data.sessionName);
                socket.emit('setSessionName', data.sessionName);
            }
        });
        socket.on('saveSettings', (data) => {
            const {
                sessionName,
                ...partialSessionConstraints
            } = sessionConstraints;
            let validationErrors = validate(data, partialSessionConstraints, {
                format: "flat"
            })
            if (!user.isAdmin) {
                socket.emit('updateFailed', "Only an administrator can update settings.");
                socket.emit('updateSettings', {
                    targetTemp: monitor.targetTemp,
                    alertHigh: monitor.alertHigh,
                    alertLow: monitor.alertLow,
                    alertMeat: monitor.alertMeat
                });
            } else if (validationErrors) {
                socket.emit('updateFailed', validationErrors[0]);
                socket.emit('updateSettings', {
                    targetTemp: monitor.targetTemp,
                    alertHigh: monitor.alertHigh,
                    alertLow: monitor.alertLow,
                    alertMeat: monitor.alertMeat
                });
            } else {
                monitor.targetTemp = data.targetTemp;
                monitor.alertHigh = data.alertHigh;
                monitor.alertLow = data.alertLow;
                monitor.alertMeat = data.alertMeat;
                socket.broadcast.emit('updateSettings', data);
            }

        });
        socket.on('getSettings', function () {
            socket.emit('updateSettings', {
                targetTemp: monitor.targetTemp,
                alertHigh: monitor.alertHigh,
                alertLow: monitor.alertLow,
                alertMeat: monitor.alertMeat
            });
        });
        socket.on('setFcmToken', function (token) {
            fcm.addFCMListener(token);
        });
    });
    return {}
}