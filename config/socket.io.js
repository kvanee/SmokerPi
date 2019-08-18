var monitor = require('../bbqMonitor');

module.exports = function (server, sessionMiddleware, fcm) {
    io = require('socket.io')(server);
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    //Emit BBQ Monitor Events
    var inAlert = false;
    monitor.subscribe(function (data) {
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
                    'Temperature Alert',
                    'Smoker Temperature: ' + data.currBbqTemp
                );
            }
        } else if (inAlert) {
            inAlert = false;
        }
    });

    io.on('connection', function (socket) {
        var userEmail;
        try {
            userEmail = socket.request.session.passport.user;
        } catch (err) {
            //swallow exception
        }
        socket.on('setBlowerState', function (data) {
            if (typeof userEmail != 'undefined') {
                monitor.setBlowerState(monitor, data.blowerState);
                socket.broadcast.emit('setBlowerState', data.blowerState);
            }
        });
        socket.on('setLogState', function (data) {
            if (typeof userEmail != 'undefined') {
                monitor.setLogState(monitor, data.logState);
                socket.broadcast.emit('setLogState', data.logState);
            }
        });
        socket.on('saveSessionName', function (data) {
            if (typeof userEmail != 'undefined') {
                monitor.setSessionName(monitor, data.sessionName);
                socket.broadcast.emit('setSessionName', data.sessionName);
                socket.emit('setSessionName', data.sessionName);
            }
        });
        socket.on('saveSettings', function (data) {
            if (typeof userEmail != 'undefined') {
                monitor.setTargetTemp(monitor, data.targetTemp);
                monitor.setAlertHigh(monitor, data.alertHigh);
                monitor.setAlertLow(monitor, data.alertLow);
                monitor.setAlertMeat(monitor, data.alertMeat);
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
}