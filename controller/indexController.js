var async = require('async');
// var crypto = require('crypto');

// const { body,validationResult } = require('express-validator/check');
// const { sanitizeBody } = require('express-validator/filter');
const company = 'Mofound';

// Models
var FoundItem = require('../model/found');
var LostItem = require('../model/lost');
var DropPoint = require('../model/droppoint');

function checkLocationData(data){
    for (var i=0; i < data.length; i++){
        var l_data = data[i];
        console.log(l_data[0], l_data[1], l_data[2]);
    }
    return;
}
exports.index = function(req, res){
    // res.send('NOT IMPLEMENTED: GROZZ HomePage');

    // Make a call to get all count for the objects
    async.parallel({
        found_item_count: function(callback){
            FoundItem.count({}, callback);
        },
        lost_item_count: function(callback){
            LostItem.count({}, callback);
        },
        returned_item_count: function(callback){
            LostItem.count({'status': 'R'}, callback);
        },
        special_items: function(callback) {
            FoundItem.find({"isSpecial": true}, callback);
        },
        special_items_count: function(callback) {
            FoundItem.count({"isSpecial": true}, callback);
        },
        all_drop_points: function(callback) {
            DropPoint.find({}, callback);
        }
    }, function(err, results){
        if (err) {
            var err = new Error('Response from database was not successful');
            err.status = 444;
            console.log('Error occurred: '+err.message);
            next(err);
        }

        // console.log('Done pulling: '+results);
        res.render('index', {
            title: "MoFound",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
}

// Get the about us page
exports.about_get = function(req, res){
    res.render('about', {title: "About"});
}

// Get the error page
exports.error_get = function(req, res){
    res.render('error', {title: "Error"});
}

// Display list of all items.
exports.item_list = function(req, res) {
    res.send('NOT IMPLEMENTED: Item list');
};

// Display list of all found items 
exports.found_item_list = function(req, res) {
    res.send('NOT IMPLEMENTED: found item list');
};

// Display list of all lost items 
exports.lost_item_list = function(req, res) {
    res.send('NOT IMPLEMENTED: mising item list');
};

exports.contact_us = function(req, res) {
    res.send('To handle contact us messages');
}






