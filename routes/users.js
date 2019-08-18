const express = require('express');
const router = express.Router();
var passport = require('passport');
const bcrypt = require('bcryptjs');
const validate = require("validate.js");
const registrationConstraints = require('../validation/registration')
var db = require("../DataStore/datastore");


//Login
router.get('/login', (req, res) => res.render("login"));

//Register
router.get('/register', (req, res) => res.render("register"));

//Register2
router.get('/register2', (req, res) => res.render("register2"));

//Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You have been logged out.')
    res.redirect('/users/login');
});

//Login Handle
router.post('/login', (req, res, next) => {
    var user = {
        email,
        password
    } = req.body;
    //Check required fields
    //Check required fields
    var validationErrors = validate(user, registrationConstraints)
    if (validationErrors)
        res.render('login', {
            validationErrors,
            email,
            password
        });
    else
        passport.authenticate('local', {
            successRedirect: "/session/new",
            failureRedirect: "/users/login",
            failureFlash: true
        })(req, res, next);
});

//Register Handle
router.post('/register', (req, res) => {
    var user = {
        email,
        password,
        confirmpassword
    } = req.body;
    //Check required fields
    var validationErrors = validate(user, registrationConstraints)

    //Check for existing user
    db.users.findOne({
        email: email
    }, function (err, doc) {
        if (doc !== null) {
            validationErrors = validationErrors || {};
            (validationErrors.email = validationErrors.email || []).push(
                'Account already registered'
            );
        }
        if (validationErrors) {
            res.render("register", {
                validationErrors,
                email,
                password,
                confirmpassword
            });
        } else {
            // Hash Password
            bcrypt.hash(password, 10).then(function (hash) {
                var newUser = {
                    email,
                    password: hash
                }
                db.users.insert(newUser);
                req.flash('success', 'You are now registered! Log in to continue.')
                res.redirect("login");
            });
        }
    });
});

module.exports = router;