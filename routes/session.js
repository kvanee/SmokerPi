const express = require('express');
const router = express.Router();
const validate = require("validate.js");
const sessionConstraints = require('../validation/session')
var monitor = require('../bbqMonitor');

router.get('/new', (req, res) => {
    res.render("session/new-session", {
        sessionName: monitor.sessionName,
        targetTemp: monitor.targetTemp,
        alertHigh: monitor.alertHigh,
        alertLow: monitor.alertLow,
        alertMeat: monitor.alertMeat
    });
});

router.post('/new', (req, res, next) => {
    const session = {
        sessionName,
        targetTemp,
        alertHigh,
        alertLow,
        alertMeat
    } = req.body;

    //Check required fields
    var validationErrors = validate(session, sessionConstraints)
    if (validationErrors) {
        res.render("session/new-session", {
            validationErrors,
            sessionName: session.sessionName,
            targetTemp: session.targetTemp,
            alertHigh: session.alertHigh,
            alertLow: session.alertLow,
            alertMeat: session.alertMeat
        });
    } else
        res.redirect("/session/dashboard/" + monitor.sessionName);
});

router.get('/complete', (req, res, next) => {
    res.render("session/complete", {
        sessionName: monitor.sessionName
    });
});

router.get('/dashboard/:sessionName', (req, res) => {
    const sessionName = req.params.sessionName;
    if (sessionName !== monitor.sessionName) {
        if (validate(sessionName, sessionNameConstraints)) {
            monitor.setSessionName(sessionName);
        } else
            res.redirect("/session/new-session");
    }
    res.render("session/dashboard", {
        currBbqTemp: monitor.currBbqTemp,
        currMeatTemp: monitor.currMeatTemp,
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

router.post('/dashboard', (req, res) => {
    monitor.isSessionStarted = false;
    res.redirect('/session/complete');
});

router.get('/loadPastSessions', (req, res) => {
    monitor.getPastSessions(function (data) {
        res.json(data);
    });
});

router.get('/loadChartData/:sessionName', (req, res) => {
    monitor.getTemperatureLog(req.params.sessionName, function (data) {
        res.json(data);
    });
});

module.exports = router;