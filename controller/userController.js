var async = require('async');
// var crypto = require('crypto');

// const { body,validationResult } = require('express-validator/check');
// const { sanitizeBody } = require('express-validator/filter');


const company = 'Mofound';

// READ: Get list of all users
exports.users = function(req, res){  
    res.send('NI: List of users here');
}

// READ: Get a particular user by id
exports.userDetail = function(req, res){
    res.send('NI: Show the detail of user with id '+ req._id);
}

// CREATE: Add a new user
exports.newUser = function(req, res){  
    res.send('NI: Add a new user here');
}

exports.newUserPost = function(req, res){  
    res.send('NI: Add a new user here: Post');
}

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