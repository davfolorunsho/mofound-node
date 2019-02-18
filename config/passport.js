
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Users = mongoose.model('Admin');

passport.use(new LocalStrategy(
    function(username, password, done) {
    Users.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (user) {
            console.log("User exits");
        }
        if (!user.verifyPassword(password)) { 
            console.log("Incorrect password")
            return done(null, false); }
        return done(null, user);
      });
    }
  ));

  passport.serializeUser(function(user, cb) {
    cb(null, user._id);
  });
  
  passport.deserializeUser(function(id, cb) {
    Users.findById(id, function (err, user) {
      if (err) { return cb(err); }
      cb(null, user);
    });
  });