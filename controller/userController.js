var async = require('async');
// var crypto = require('crypto');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var User = require('../model/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// var passport = require('../config/passport');

const company = 'Mofound';

// READ: Get list of all users
exports.users = function(req, res){  
    res.send('NI: List of users here');
}

exports.userLoginGet = function(req, res) {
    res.render('login', {title: "Login"});
}

exports.userLoginPost = [
    body('email', "Email is required to Login").isLength({ min: 1 }).trim(),
    body('password', "Password is required to Login").isLength({ min: 1 }).trim(),

    sanitizeBody('*').escape(),

    function(req, res, next){
        const { body: { user } } = req;
        // return passport.authenticate('local', {session: true, failureRedirect: '/users/new'}, (err, passportUser, info)=>{
        //     if (err){
        //         // if error is returned
        //         return next(err);
        //     }
        //     if (passportUser){
        //         // if a user is returned
        //         // create user and set token to user
        //         var user = passportUser;
        //         user.token = passportUser.generateJWT();

        //         return res.redirect('/item/lost/new');
        //     }

        //     return res.status(400).info;
        // })(req, res, next);
        res.redirect('/item/lost/new');
    }
];


// READ: Get a particular user by id
exports.userDetail = function(req, res){
    res.send('NI: Show the detail of user with id '+ req._id);
}

// CREATE: Add a new user
exports.newUser = function(req, res){  
    res.render('register', {title: "Register"});
}

exports.newUserPost = [
    // Validate the inputs
    body('name').isLength({min: 1}).withMessage('Name should not be empty!')
        .isAlpha().withMessage('Name must be alphabet letters.'),
    body('email').isLength({ min: 1 }).trim().withMessage('Email should not be empty'),
    body('phone').isLength({ min: 1 }).trim().withMessage('Phone No should not be empty'),    
    body('password', "Password is required to Login").isLength({ min: 1 }).trim(),
    body('cpassword', 'Passwords must match').equals(body('password')),
    // Sanitize the inputs
    sanitizeBody('*').escape(),

    // After sanitization and validation, register the user's information
    function(req, res, next){
          // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/errors messages.
        // Error messages can be returned in an array using `errors.array()`.
        console.log("Error from the form "+ errors.array);
        res.render('register', {title: 'Register', errors: errors.array});
        }
    else {
        // Data from form is valid.
        console.log('Correct');
        res.send('NI: Add a new user here: Post');
    }    
    // res.send('NI: Add a new user here: Post');
}
];

// UPDATE: update user
exports.updateUser = function(req, res){
    res.send('NI: update user with id '+req.params.id);
}

exports.updateUserPost = function(req, res){
    res.send('NI: post update user with id '+req.params.id);
}

// DELETE: delete user
exports.deleteUser = function(req, res){
    res.send('NI: delete the user with id '+req.params.id);
}