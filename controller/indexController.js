var async = require('async');
// var crypto = require('crypto');

// const { body,validationResult } = require('express-validator/check');
// const { sanitizeBody } = require('express-validator/filter');


const company = 'Mofound';

exports.index = function(req, res){
    // res.send('NOT IMPLEMENTED: GROZZ HomePage');

    // Make a call to get all count for the objects
    // async.parallel({
    //     user_count: function(callback){
    //         User.count({}, callback);
    //     },
    //     job_count: function(callback) {
    //         Job.count({status: 'Completed'}, callback);
    //     },
    //     transaction_count: function(callback){
    //         Transaction.count({}, callback);
    //     },
    //     skill_count: function(callback){
    //         Skill.count({}, callback);
    //     },
    //     job_categories: function(callback) {
    //         JobCategory.find(callback);
    //     }

    // }, function(err, results){
    //     if (err) console.log('Error occurred: '+err);

    //     // console.log('Done pulling: '+results);
    //     res.render('index', {
    //         title: "Grozz-Home",
    //         company: "Grozz",             
    //         error: err, 
    //         data: results});
    // });    
    res.render('index', {title: "Mofound"});
}
