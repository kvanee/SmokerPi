const express = require('express');
const router = express.Router();
const validate = require("validate.js");
const sessionConstraints = require('../validation/session');
const {
    authenticateAdmin
} = require('../config/authenticate');
const monitor = require('../bbq/bbqMonitor');

router.get('/new', (req, res) => {
    res.render("session/new-session", {
        sessionName: monitor.sessionName,
        targetTemp: monitor.targetTemp,
        alertHigh: monitor.alertHigh,
        alertLow: monitor.alertLow,
        alertMeat: monitor.alertMeat
    });
});

router.post('/new', authenticateAdmin, (req, res, next) => {
    const session = {
        sessionName,
        targetTemp,
        alertHigh,
        alertLow,
        alertMeat
    } = req.body;

    //Check required fields
    let validationErrors = validate(session, sessionConstraints)
    if (validationErrors) {
        res.render("session/new-session", {
            validationErrors,
            sessionName: session.sessionName,
            targetTemp: session.targetTemp,
            alertHigh: session.alertHigh,
            alertLow: session.alertLow,
            alertMeat: session.alertMeat
        });
    } else {
        //monitor.start();
        res.redirect("/session/dashboard/" + monitor.sessionName);
    }
});

router.get('/complete', (req, res, next) => {
    res.render("session/complete", {
        sessionName: monitor.sessionName
    });
});

router.get('/dashboard', (req, res) => {
    if (typeof req.user != 'undefined' && req.user.isAdmin && !monitor.isSessionStarted)
        res.redirect("/session/new");
    else
        res.render("session/dashboard", {
            currBbqTemp: monitor.currBbqTemp.toFixed(1),
            currMeatTemp: monitor.currMeatTemp.toFixed(1),
            targetTemp: monitor.targetTemp,
            isBlowerOn: monitor.isBlowerOn,
            blowerState: monitor.blowerState,
            logState: monitor.logState,
            sessionName: monitor.sessionName,
            alertHigh: monitor.alertHigh,
            alertLow: monitor.alertLow,
            alertMeat: monitor.alertMeat,
            isAdmin: req.user.isAdmin
        });
});

router.get('/dashboard/:sessionName', (req, res) => {
    const sessionName = req.params.sessionName;
    if (sessionName !== monitor.sessionName)
        if (validate(sessionName, sessionConstraints))
            monitor.setSessionName(sessionName);

    res.render("session/dashboard", {
        currBbqTemp: monitor.currBbqTemp.toFixed(1),
        currMeatTemp: monitor.currMeatTemp.toFixed(1),
        targetTemp: monitor.targetTemp,
        isBlowerOn: monitor.isBlowerOn,
        blowerState: monitor.blowerState,
        logState: monitor.logState,
        sessionName: monitor.sessionName,
        alertHigh: monitor.alertHigh,
        alertLow: monitor.alertLow,
        alertMeat: monitor.alertMeat
    });
});

router.post('/dashboard', authenticateAdmin, (req, res) => {
    monitor.isSessionStarted = false;
    res.redirect('/session/complete');
});

router.get('/loadPastSessions', (req, res) => {
    monitor.getPastSessions(function (data) {
        res.json(data);
    });
});

router.get('/loadChartData/:sessionName', (req, res) => {
    monitor.getTemperatureLog(req.params.sessionName)
        .then((data) => {
            res.json(data);
        }).catch((err) => {
            console.log(err);
        });
});

module.exports = router;