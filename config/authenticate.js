module.exports = {
    authenticate: function (req, res, next) {
        if (typeof req.user != 'undefined') {
            return next();
        }
        req.flash('error', 'Please log in')
        res.redirect('/users/login')
    }
}