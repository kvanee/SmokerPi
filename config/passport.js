const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

//DB
var db = require("../DataStore/datastore");

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({
            usernameField: 'email'
        }, (email, password, done) => {
            //Match User
            db.users.findOne({
                email: email
            }, (err, user) => {
                if (err) throw err;
                if (!user) {
                    return done(null, false, {
                        message: "Account not registered"
                    });
                }
                //Match Password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, {
                            message: 'Incorrect Password'
                        });
                    }
                });
            });
        })
    );
    passport.serializeUser((user, done) => {
        done(null, user.email);
    });

    passport.deserializeUser((id, done) => {
        db.users.findOne({
            email: id
        }, (err, user) => {
            done(err, user);
        });
    });
}