var async = require('async');
// var crypto = require('crypto');

// const { body,validationResult } = require('express-validator/check');
// const { sanitizeBody } = require('express-validator/filter');
const company = 'Mofound';

// Models
var Item = require('../model/item');
var FoundItem = require('../model/foundItem');
var LostItem = require('../model/lostItem');
var User = require('../model/user');

exports.index = function(req, res){
    // res.send('NOT IMPLEMENTED: GROZZ HomePage');

    // Make a call to get all count for the objects
    async.parallel({
        user_count: function(callback){
            User.count({}, callback);
        },
        item_count: function(callback) {
            // Item.count({status: 'Completed'}, callback);
            Item.count({}, callback);
        },
        found_item_count: function(callback){
            FoundItem.count({}, callback);
        },
        lost_item_count: function(callback){
            LostItem.count({}, callback);
        },
        returned_item_count: function(callback){
            FoundItem.count({'status': 'R'}, callback);
        }
    }, function(err, results){
        if (err) console.log('Error occurred: '+err);

        // console.log('Done pulling: '+results);
        res.render('index', {
            title: "MoFound",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
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

// Display detail page for a specific found item.
exports.found_item_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem detail: ' + req.params.id);
};

// Display detail page for a specific lost item.
exports.lost_item_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: LostItem detail: ' + req.params.id);
};

// Display foundItem create form on GET.
exports.found_item_create_get = function(req, res) {
    // Make a call to get all count for the objects
    async.parallel({
        user_count: function(callback){
            FoundItem.count({}, callback);
        },
        
        
    }, function(err, results){
        if (err) console.log('Error occurred: '+err);

        // console.log('Done pulling: '+results);
        res.render('found_item_form', {
            title: "Found",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
    // res.send('NOT IMPLEMENTED: FoundItem create GET');
};

// Display lostItem create form on GET.
exports.lost_item_create_get = function(req, res) {
    async.parallel({
        user_count: function(callback){
            FoundItem.count({}, callback);
        },
        
        
    }, function(err, results){
        if (err) console.log('Error occurred: '+err);

        // console.log('Done pulling: '+results);
        res.render('lost_item_form', {
            title: "Lost",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
    // res.send('NOT IMPLEMENTED: LostItem create GET');
};

// Handle foundItem create on POST.
exports.found_item_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem create POST');
};

// Handle lostItem create on POST.
exports.lost_item_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem create POST');
};

// Display foundItem delete form on GET.
exports.found_item_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem delete GET '+req.params.id);
};

// Display lostItem delete form on GET.
exports.lost_item_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: lostItem delete GET '+req.params.id);
};

// Handle foundItem delete on POST.
exports.found_item_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: foundItem delete POST');
};

// Handle lostItem delete on POST.
exports.lost_item_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: LostItem delete POST');
};

// Display foundItem update form on GET.
exports.found_item_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem update GET');
};
// Display lostItem update form on GET.
exports.lost_item_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: LostItem update GET');
};

// Handle foundItem update on POST.
exports.found_item_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: foundItem update POST');
};

// Handle lostItem update on POST.
exports.lost_item_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: lostItem update POST');
};





