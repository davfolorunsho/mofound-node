var async = require('async');
// var crypto = require('crypto');
var fs = require('fs');
// var crypto = require('crypto');
var FoundItem = require('../model/found');
var LostItem = require('../model/lost');
var Item = require('../model/item');

var User = require('../model/user');
var randomize = require('randomatic');
var stringSimilarity = require('string-similarity');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const company = 'Mofound';

// Models
var Item = require('../model/item');
var FoundItem = require('../model/found');
var LostItem = require('../model/lost');
var User = require('../model/user');

// Generate the Code
function generateCode(){   
    var rand = randomize('0Aa', 7);
    genCode = rand;
    return rand;
}

// Check for match
function checkForMatch(lost, item_array){
    var new_detail = lost; // Get lost item details
    var other_detail = "None";  // Initialize the other detail from found
    var similarity_level = 0; // initialize similarity level
    var match = null;

        // Loop through the available reported lost or found item
        for (var i=0; i < item_array.length; i++){
            // Get each entry in the found_item array
            other_detail = item_array[i].detail;                
            // console.log("Current Found Item: No "+i+"-"+other_detail);

            // Perform a stringSimilarity on the two strings
            var similarity = stringSimilarity.compareTwoStrings(new_detail, other_detail);
            console.log(i+"-Compared: "+new_detail+"\n  --AGAINST-- \n "+other_detail);
            // Make similarity at 100%
            similarity_level = similarity * 100;
            if (similarity_level > 60){
                // if similarity is 
                console.log("Matcher: Seems a match was found: "+similarity_level+"%");
                // Set match to be the item found to match
                match = item_array[i]; 
                console.log("Matcher: Match found is "+match);               
            }else{
                console.log("Matcher: A match was not found: "+similarity_level+"%");
            }  
        }        
        return match;
}

exports.index = function(req, res){
    // Make a call to get all neede info from db
    async.parallel({
        user_count: function(callback){
            User.countDocuments({}, callback);
        },
        found_item_count: function(callback){
            FoundItem.countDocuments({}, callback);
        },
        lost_item_count: function(callback){
            LostItem.countDocuments({}, callback);
        },
        returned_item_count: function(callback){
            LostItem.countDocuments({'status': 'R'}, callback);
        },
        matched_lost_item: function(callback) {
            LostItem.countDocuments({'match_found': true}, callback);            
        },
        matched_found_item: function(callback) {
            FoundItem.countDocuments({'match_found': true}, callback);            
        },
        lost_list: function(callback) {
            LostItem.find({}, callback);
        },
        found_list: function(callback) {
            FoundItem.find({}, callback);
        },
        boxed_found: function(callback) {
            FoundItem.find({'status': 'Boxed'}, callback);
        },
        boxed_lost: function(callback) {
            LostItem.find({'status': 'Boxed'}, callback);
        }
    }, function(err, results){
        if (err) {
            var err = new Error('Response from database was not successful');
            err.status = 444;
            console.log('Error occurred: '+err.message);
            next(err);
        }

        // console.log('Done pulling: '+results);
        res.render('admin_index', {
            title: "Admin",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
    // res.render('admin_index', {title: 'Admin'});
}
// Display list of all items.
exports.item_list = function(req, res) {
    res.send('NOT IMPLEMENTED: Item list');
};

// Display list of all found items 
exports.found_item_list = function(req, res) {  
    async.parallel({
        found_list : function(callback){
            FoundItem.find({}, callback);
        },
        found_list_count: function(callback){
            FoundItem.find().countDocuments({}, callback);
        },
        boxed_found: function(callback) {
            FoundItem.find({'status': 'Boxed'}, callback);
        }

    }, function(err, results){
        res.render('admin_foundlist', {
            title: "Found Items",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
    
};

// Display list of all lost items 
exports.lost_item_list = function(req, res) {
    async.parallel({
        lost_list : function(callback){
            LostItem.find({}, callback);
        },
        lost_list_count: function(callback){
            LostItem.find().countDocuments({}, callback);
        },
        boxed_lost: function(callback) {
            LostItem.find({'status': 'Boxed'}, callback);
        }

    }, function(err, results){
        res.render('admin_lostlist', {
            title: "Lost Items",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
};

// Display detail page for a specific found item.
exports.found_item_detail = function(req, res) {
    // Get the item from the id
    async.parallel({
        found_item: function(callback) {
            FoundItem.findOne({'_id': req.params.id}).exec(callback);
        },
        
    }, function(err, results){
        if (err) {
            // No result was found
            var err = new Error('Item not found error');
            err.status = 404;
            return next(err);
        }

        if (results.found_item == null){
            // No result was found
            var err = new Error('Item not found error');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        console.log("showing "+results.found_item);
        res.render(
            'admin_found_detail', {
                title: results.found_item.name,
                company: "MoFound NG",             
                error: err,
                data: results
            });
    });
    // res.send('NOT IMPLEMENTED: FoundItem detail: ' + req.params.id);
};

// Display detail page for a specific lost item.
exports.lost_item_detail = function(req, res) {
    // Get the item from the id
    async.parallel({
        lost_item: function(callback) {
            LostItem.findOne({'_id': req.params.id}).exec(callback);
        },
        
    }, function(err, results){
        if (err) {
            // No result was found
            var err = new Error('Item not found error');
            err.status = 404;
            return next(err);
        }

        if (results.lost_item == null){
            // No result was found
            var err = new Error('Item not found error');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        console.log("showing "+results.lost_item);
        res.render(
            'admin_lost_detail', {
                title: results.lost_item.name,
                company: "MoFound NG",             
                error: err,
                data: results
            });
    });
};

// Display foundItem create form on GET.
exports.found_item_create_get = function(req, res) {
    async.parallel({
        found_list : function(callback){
            FoundItem.find({}, callback);
        },
        found_list_count: function(callback){
            FoundItem.find().countDocuments({}, callback);
        },
        boxed_found: function(callback) {
            FoundItem.find({'status': 'Boxed'}, callback);
        }

    }, function(err, results){
        res.render('admin_create_found', {
            title: "Found Items",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
};

// Display lostItem create form on GET.
exports.lost_item_create_get = function(req, res) {
    async.parallel({
        found_list : function(callback){
            LostItem.find({}, callback);
        },
        found_list_count: function(callback){
            LostItem.find().countDocuments({}, callback);
        },
        boxed_found: function(callback) {
            LostItem.find({'status': 'Boxed'}, callback);
        }

    }, function(err, results){
        res.render('admin_create_lost', {
            title: "Lost Items",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
};

// Handle foundItem create on POST.
exports.found_item_create_post = [
    body('name').isLength({ min: 1 }).trim().withMessage("Item's name is required"),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!').isMobilePhone().withMessage('Reporter takes only phone number'),
    body('location').optional(),
    // body('category').equals(!'-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),
    
    // handle the req, and res and next
    (req, res, next) => {
        // Extract validation and sanitization errors
        const errors = validationResult(req);

        // if there was error return the form
        if (!errors.isEmpty()){
            // There are errors. Render form again
            console.error('ItemController.js - Error Submitting form: '+errors.array()[0].message);
            return res.render('admin_create_found', {
                title: "Found",
                company: "MoFound NG",             
                error: errors.array()
            });
        }
        // No errors submitting form, proceed to saving the info
        // Create a lost object with escaped and trimmed
        var found_item = new FoundItem({
            name: req.body.name,
            category: req.body.category,
            brand: req.body.brand,
            major_color: req.body.color,
            size_group: req.body.size,
            other_info: req.body.other_info,
            image: req.body.image,
            location: req.body.location,
            reporter: req.body.reporter,
            status: req.body.status,    
            code: generateCode()    
        });

        // Make the detail out
        found_item.makeDetail();
        
        // Check if the reported item matches the adjacent item type
        LostItem.find({}, function(err, lost_items){
            // handle error
            if (err) {return next(err)};

            if (lost_items == null){
                err = new Error('Error fetching lost items, please go home');
                err.status = 500;
                console.error("ItemController: Error fetching lost items");
                return next(err);
            } 

            // For found items were returned
            console.log("ItemController: Start Matching the file");
            // Run a match test
            var item_matched = checkForMatch(found_item.detail, lost_items);
                // if the similarity is above 60%- send msg to admin/Notify the reporter
                if (item_matched != null){
                    // Item is matched, Notify the user/admin and update the found items match_found value
                    found_item.match_found = true;
                    
                    console.log("\n \n****---ItemController: Update Lost Item match_found to be : "+found_item.match_found);
                    // Update the corresponding match_found value for matched item
                    item_matched.match_found = true;
                    var matched_item = {
                        match_found: true
                    }

                    // Update the adjacent item
                    LostItem.findByIdAndUpdate(item_matched._id, matched_item, {}, function(err){
                        if (err) {
                            var err = new Error('Sorry An Error Occurred');
                            err.status = 500;
                            console.log('Error updating the fucking file ');
                            return next(err);
                        }
                        console.log("****----ItemController: Update Found Item match_found to be : "+item_matched.match_found+"\n \n");
                    });
                }
                // Save the object after checking for match
                found_item.save(function (err){
                    if (err){
                        var err = new Error("Unable to save item");
                        err.status = 500;                        
                        return res.render('found_item_form', {
                            title: "Found",
                            company: "MoFound NG",             
                            error: err
                        });
                    }                    
                    console.log("ItemController: Saving the item, to start matching.");
                    return res.redirect('/admin/founds');
                });
                                
        });        
        // // successful -redirect to new item detail
        // return res.redirect(lost_item.url);
    }
];

// Handle lostItem create on POST.
exports.lost_item_create_post = [
    body('name').isLength({ min: 1 }).trim().withMessage("Item's name is required"),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!').isMobilePhone().withMessage('Reporter takes only phone number'),
    body('location').optional(),
    // body('category').equals(!'-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),
    
    // handle the req, and res and next
    (req, res, next) => {
        // Extract validation and sanitization errors
        const errors = validationResult(req);

        // if there was error return the form
        if (!errors.isEmpty()){
            // There are errors. Render form again
            console.error('ItemController.js - Error Submitting form: '+errors.array()[0].message);
            return res.render('admin_create_lost', {
                title: "Found",
                company: "MoFound NG",             
                error: errors.array()
            });
        }
        // No errors submitting form, proceed to saving the info
        // Create a lost object with escaped and trimmed
        var lost_item = new FoundItem({
            name: req.body.name,
            category: req.body.category,
            brand: req.body.brand,
            major_color: req.body.color,
            size_group: req.body.size,
            other_info: req.body.other_info,
            image: req.body.image,
            location: req.body.location,
            reporter: req.body.reporter,
            status: req.body.status,    
            code: generateCode()    
        });

        // Make the detail out
        lost_item.makeDetail();
        
        // Check if the reported item matches the adjacent item type
        FoundItem.find({}, function(err, found_items){
            // handle error
            if (err) {return next(err)};

            if (found_items == null){
                err = new Error('Error fetching lost items, please go home');
                err.status = 500;
                console.error("ItemController: Error fetching lost items");
                return next(err);
            } 

            // For found items were returned
            console.log("ItemController: Start Matching the file");
            // Run a match test
            var item_matched = checkForMatch(lost_item.detail, found_items);
                // if the similarity is above 60%- send msg to admin/Notify the reporter
                if (item_matched != null){
                    // Item is matched, Notify the user/admin and update the found items match_found value
                    lost_item.match_found = true;
                    
                    console.log("\n \n****---ItemController: Update Found Item match_found to be : "+found_item.match_found);
                    // Update the corresponding match_found value for matched item
                    item_matched.match_found = true;
                    var matched_item = {
                        match_found: true
                    }

                    // Update the adjacent item
                    FoundItem.findByIdAndUpdate(item_matched._id, matched_item, {}, function(err){
                        if (err) {
                            var err = new Error('Sorry An Error Occurred');
                            err.status = 500;
                            console.log('Error updating the fucking file ');
                            return next(err);
                        }
                        console.log("****----ItemController: Update Lost Item match_found to be : "+item_matched.match_found+"\n \n");
                    });
                }
                // Save the object after checking for match
                lost_item.save(function (err){
                    if (err){
                        var err = new Error("Unable to save item");
                        err.status = 500;                        
                        return res.render('lost_item_form', {
                            title: "Lost",
                            company: "MoFound NG",             
                            error: err
                        });
                    }                    
                    console.log("ItemController: Saving the item, to start matching.");
                    return res.redirect('/admin/losts');
                });
                                
        });        
        // // successful -redirect to new item detail
        // return res.redirect(lost_item.url);
    }
];

// Display foundItem delete form on GET.
exports.found_item_delete_get = function(req, res) {
    async.parallel({
        found_item: function(callback) {
            FoundItem.findById(req.params.id).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.found_item==null) { // No results.
            res.redirect('/admin/founds');
        }
        // Successful, so render.
        res.render('admin_found_delete', { title: results.found_item.name, data: results});
    });
};

// Display lostItem delete form on GET.
exports.lost_item_delete_get = function(req, res) {
    async.parallel({
        lost_item: function(callback) {
            LostItem.findById(req.params.id).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.lost_item==null) { // No results.
            res.redirect('/admin/losts');
        }
        // Successful, so render.
        res.render('admin_lost_delete', { title: results.lost_item.name, data: results});
    });
    // res.send('Checking Delete GET');
};

// Handle foundItem delete on POST.
exports.found_item_delete_post = function(req, res) {
    // Success
    FoundItem.findByIdAndRemove(req.params.id, function(err) {
        if (err) { return next(err); }
        // Success - go to author list
        res.redirect('/admin/founds');
    });
};

// Handle lostItem delete on POST.
exports.lost_item_delete_post = function(req, res) {
    // Success
    LostItem.findByIdAndRemove(req.params.id, function(err) {
        if (err) { return next(err); }
        // Success - go to author list
        res.redirect('/admin/losts');
    });
};

// Display foundItem update form on GET.
exports.found_item_update_get = function(req, res) {
    async.parallel({
        found_item : function(callback){
            FoundItem.findById({'_id': req.params.id}).exec(callback);
        }
    }, function(err, results){
        if (err){
            console.log("There was an error fetching this");
        }
        res.render('admin_update_found_form', {
            title: "Found",
            company: "MoFound NG",             
            error: err,
            data: results
        });
    });
    // res.send('NOT IMPLEMENTED: FoundItem update GET');
};
// Display lostItem update form on GET.
exports.lost_item_update_get = function(req, res) {
    async.parallel({
        lost_item : function(callback){
            LostItem.findById({'_id': req.params.id}).exec(callback);
        }
    }, function(err, results){
        if (err){
            console.log("There was an error fetching this");
        }
        res.render('admin_update_lost_form', {
            title: "Lost",
            company: "MoFound NG",             
            error: err,
            data: results
        });
    });
};

// Handle foundItem update on POST.
exports.found_item_update_post = [
    body('name', "Item's name is required").isLength({ min: 1 }).trim(),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!').isMobilePhone().withMessage('Reporter takes only phone number'),
    body('location').optional(),
    // body('category').equals('-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),

    (req, res, next) => {

        const errors = validationResult(req);

        var found_item = {
                name: req.body.name,
                category: req.body.category,
                brand: req.body.brand,
                major_color: req.body.color,
                other_info: req.body.other_info,
                image: req.body.image,
                reporter: req.body.reporter,
                other_info: req.body.other_info,
                location: req.body.location,
                status: req.body.status,
                detail: req.body.color+" "+req.body.brand+" "+req.body.name+" and "+req.body.other_info+" in "+req.body.category+" category."
            };

        if (!errors.isEmpty()){
            // error reload the page
            res.render('admin_update_found_form', {
                title: "Found",
                company: "MoFound NG",             
                error: errors.array(),
            });            
        }else{
            FoundItem.findByIdAndUpdate(req.params.id, found_item, {}, function(err, the_item){
                if(err) {  
                    console.error('Error updating');                  
                    return next(err); 
                }
                // Successful - redirect to the detail
                res.redirect(the_item.admin_url);
            });
        }
    }
    // res.send('NOT IMPLEMENTED: lostItem update POST '+req.params.id);
];

// Handle lostItem update on POST.
exports.lost_item_update_post = [
    body('name', "Item's name is required").isLength({ min: 1 }).trim(),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!').isMobilePhone().withMessage('Reporter takes only phone number'),
    body('location').optional(),
    // body('category').equals('-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),

    (req, res, next) => {

        const errors = validationResult(req);

        var lost_item = {
                name: req.body.name,
                category: req.body.category,
                brand: req.body.brand,
                major_color: req.body.color,
                other_info: req.body.other_info,
                image: req.body.image,
                reporter: req.body.reporter,
                other_info: req.body.other_info,
                location: req.body.location,
                status: req.body.status,
                detail: req.body.color+" "+req.body.brand+" "+req.body.name+" and "+req.body.other_info+" in "+req.body.category+" category."
            };

        if (!errors.isEmpty()){
            // error reload the page
            res.render('admin_update_lost_form', {
                title: "Found",
                company: "MoFound NG",             
                error: errors.array(),
            });            
        }else{
            LostItem.findByIdAndUpdate(req.params.id, lost_item, {}, function(err, the_item){
                if(err) {  
                    console.error('Error updating');                  
                    return next(err); 
                }
                // Successful - redirect to the detail
                res.redirect(the_item.admin_url);
            });
        }
    }
    // res.send('NOT IMPLEMENTED: lostItem update POST '+req.params.id);
];





