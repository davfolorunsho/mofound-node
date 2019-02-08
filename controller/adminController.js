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
function checkForMatch(item, item_array){
    var new_detail = item; // Get lost item details
    var other_detail = "None";  // Initialize the other detail from found
    var similarity_level = 0; // initialize similarity level
    var match = null;

    console.log("VERBOSE: MatchCheckerModule- Item detail to match: =>\n"+new_detail);
        // Loop through the available reported lost or found item
        for (var i=0; i < item_array.length; i++){
            // Get each entry in the found_item array
            other_detail = item_array[i].detail;                
            
            // Perform a stringSimilarity on the two strings
            var similarity = stringSimilarity.compareTwoStrings(new_detail, other_detail);
            console.log("VERBOSE: MatchCheckerModule- "+i+"\n --Compared against-- \n "+other_detail);
            // Make similarity at 100%
            similarity_level = similarity * 100;
            if (similarity_level > 65){
                // if similarity is 
                console.log("VERBOSE: MatchCheckerModule-YES!, Seems a match was found AT : "+similarity_level+"%");
                // Set match to be the item found to match
                match = item_array[i]; 
                console.log("VERBOSE: MatchCheckerModule- Match found is "+match.detail);               
            }else{
                console.log("VERBOSE: MatchCheckerModule-NO!, No match was found AT: "+similarity_level+"%");
            }  
        }        
        return match;
}

function createObject(type, req, res, ObjectSchema, adjacentObjectSchema, form, next ) {
    // Extract validation and sanitization errors
    const errors = validationResult(req);

    // if there was error return the form
    if (!errors.isEmpty()){
        // There are errors. Render form again
        console.error('VERBOSE: ItemController.js - Error Submitting form: '+errors.array());
        return res.render(form, {
            title: type,
            company: "MoFound NG",             
            error: errors.array()
        });
    }
    // No errors submitting form, proceed to saving the info
    // Create a lost object with escaped and trimmed
    var new_item = new ObjectSchema({
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
    new_item.makeDetail();
    console.log('DEBUG: ItemController.js - Item details recorded');
    
    // Check if the reported item matches the adjacent item type
    adjacentObjectSchema.find({}, function(err, returned_adjacent_items){
        // handle error
        if (err) {return next(err)};

        if (returned_adjacent_items == null){
            err = new Error('Error fetching adjacent items, please go home');
            err.status = 500;
            console.error("ItemController: Error fetching adjecent items");
            return next(err);
        } 
        // For found items were returned
        console.log('DEBUG: ItemController.js - Run a match for the item in DB');
        // Run a match test
        var item_matched = checkForMatch(new_item.detail, returned_adjacent_items);
            // if the similarity is above 60%- send msg to admin/Notify the reporter
            if (item_matched != null){
                console.log('DEBUG: ItemController.js - Match was found');
                // Item is matched, Notify the user/admin and update the found items match_found value
                new_item.match_found = true;
                new_item.matched_item = item_matched // Here 2- Set the item matched for base
                
                console.log('DEBUG: ItemController.js - Updated Item match_found to be : '+new_item.match_found);
                // console.log("\n \n****---ItemController: Update and add Lost Item match_found to be : "+found_item.match_found);
                // Update the corresponding match_found value for matched item, and also the item matched
                var matched_item = {
                    match_found: true,
                    matched_item: new_item // Here 1- Set the item matched for base
                }

                // Update the adjacent item
                adjacentObjectSchema.findByIdAndUpdate(item_matched._id, {"$set": {match_found: true, matched_item: new_item}}, function(err){
                    if (err) {
                        var err = new Error('Sorry An Error Occurred');
                        err.status = 500;
                        console.error('DEBUG: ItemController.js - cant update the file ');
                        return next(err);
                    }
                    console.log('DEBUG: ItemController.js - Updated corresponding Matched Item match_found to be : '+item_matched.match_found);
                });
            }
            // Save the object after checking for match
            new_item.save(function (err){
                if (err){
                    var err = new Error("Unable to save item");
                    err.status = 500;                        
                    return res.render(form, {
                        title: type,
                        company: "MoFound NG",             
                        error: err
                    });
                }                    
                console.log("ItemController: Saving the item, to start matching.");
                return res.redirect(new_item.admin_url);
            });
                            
    });

}

// Update the item
function updateObject(type, req, res, ObjectSchema, adjacentObjectSchema, form, next) {
    const errors = validationResult(req);
        // 1. Get the details
        var base_item ={
                name: req.body.name,
                category: req.body.category,
                brand: req.body.brand,
                major_color: req.body.color,
                other_info: req.body.other_info,
                image: req.body.image,
                reporter: req.body.reporter,
                other_info: req.body.other_info,
                location: req.body.location,
                detail: req.body.color+" "+req.body.brand+" "+req.body.name+" and "+req.body.other_info+" in "+req.body.category+" category.",
                // _id: req.params.id
            };
            // base_item.makeDetail();

        // Check for error
        if (!errors.isEmpty()){
            // error reload the page
            console.error('VERBOSE: ItemController.js- Error from form details, the form page is suppossed to be up again');
            res.render(form, {
                title: type,
                company: "MoFound NG",             
                error: errors.array(),
            });            
        }else{
            // No error from filling form
            // base_item.makeDetail();
            async.parallel({
                first_update: function(callback){
                    ObjectSchema.findByIdAndUpdate(req.params.id, base_item, callback);
                },
                base_item_raw_update: function(callback){
                    ObjectSchema.findByIdAndUpdate(req.params.id, base_item, callback);
                },
                all_adjacent_item: function(callback){
                    adjacentObjectSchema.find({}, callback);
                }
            }, function(err, results){
                // Run a match for th base_item_raw_update against lis to all_adjacent_item\
                console.log("The detail to match "+results.base_item_raw_update.detail);
                var check_match_item = checkForMatch(results.base_item_raw_update.detail, results.all_adjacent_item);
                // res.send(results.base_item_raw_update.detail)
                // Confirm match for the item
                var base_matched_item = results.first_update;
                var analog_matched_item = results.first_update.matched_item;
                console.log("*********---------- ", check_match_item);
                if (check_match_item != null){
                    async.parallel({
                        base_item_updat: function(callback){
                            ObjectSchema.findByIdAndUpdate(results.base_item_raw_update._id, {"$set": {match_found: true, matched_item: check_match_item}}, callback);
                        },
                        adjacent_item_updat: function(callback){
                            adjacentObjectSchema.findByIdAndUpdate(check_match_item._id, {"$set": {match_found: true, matched_item: results.base_item_raw_update}}, callback);
                        },
                        base_item_update: function(callback){
                            ObjectSchema.findByIdAndUpdate(results.base_item_raw_update._id, {"$set": {match_found: true, matched_item: check_match_item}}, callback);
                        },
                        adjacent_item_update: function(callback){
                            adjacentObjectSchema.findByIdAndUpdate(check_match_item._id, {"$set": {match_found: true, matched_item: results.base_item_raw_update}}, callback);
                        }
                    }, function(err, updated_items){
                        res.redirect(updated_items.base_item_update.admin_url);                            
                    })
                }else{
                    // No match was found for match_check
                     
                    adjacentObjectSchema.findByIdAndUpdate(results.base_item_raw_update.matched_item, {"$set": {match_found: false, matched_item: undefined}}, function (err, params) {
                        console.log("Update......................");
                        ObjectSchema.findByIdAndUpdate(req.params.id, {"$set": {match_found: false, matched_item: undefined}}, function(err){
                            if (err) {
                                return next(err);
                            }
                            res.redirect(results.base_item_raw_update.admin_url);                            
                        });
                    });
                    
                }
            })
        }

}

function deleteObject(type, req, res, ObjectSchema, adjacentObjectSchema, form) {
    ObjectSchema.findById(req.params.id, function(err, item_to_delete){
        if(err){
            console.error(err);
            return next(err);
        }
        if(item_to_delete.match_found){
            adjacentObjectSchema.findByIdAndUpdate(item_to_delete.matched_item, {"$set": {match_found:false, matched_item:undefined}}, function(err, updated_item_delete){
                console.log("Updated Item: "+updated_item_delete);
            })
        }
    });
    ObjectSchema.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.error(err);
            return next(err);
        }
        res.redirect('/admin/'+type+"s");
    });       
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
exports.lost_item_detail = function(req, res, next) {
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

        createObject("Found", req, res, FoundItem, LostItem, "admin_create_found", next);

        // // Extract validation and sanitization errors
        // const errors = validationResult(req);

        // // if there was error return the form
        // if (!errors.isEmpty()){
        //     // There are errors. Render form again
        //     console.error('ItemController.js - Error Submitting form: '+errors.array()[0].message);
        //     return res.render('admin_create_found', {
        //         title: "Found",
        //         company: "MoFound NG",             
        //         error: errors.array()
        //     });
        // }
        // // No errors submitting form, proceed to saving the info
        // // Create a lost object with escaped and trimmed
        // var found_item = new FoundItem({
        //     name: req.body.name,
        //     category: req.body.category,
        //     brand: req.body.brand,
        //     major_color: req.body.color,
        //     size_group: req.body.size,
        //     other_info: req.body.other_info,
        //     image: req.body.image,
        //     location: req.body.location,
        //     reporter: req.body.reporter,
        //     status: req.body.status,    
        //     code: generateCode()    
        // });

        // // Make the detail out
        // found_item.makeDetail();
        
        // // Check if the reported item matches the adjacent item type
        // LostItem.find({}, function(err, lost_items){
        //     // handle error
        //     if (err) {return next(err)};

        //     if (lost_items == null){
        //         err = new Error('Error fetching lost items, please go home');
        //         err.status = 500;
        //         console.error("ItemController: Error fetching lost items");
        //         return next(err);
        //     } 

        //     // For found items were returned
        //     console.log("ItemController: Start Matching the file");
        //     // Run a match test
        //     var item_matched = checkForMatch(found_item.detail, lost_items);
        //         // if the similarity is above 60%- send msg to admin/Notify the reporter
        //         if (item_matched != null){
        //             // Item is matched, Notify the user/admin and update the found items match_found value
        //             found_item.match_found = true;
                    
        //             console.log("\n \n****---ItemController: Update Lost Item match_found to be : "+found_item.match_found);
        //             // Update the corresponding match_found value for matched item
        //             item_matched.match_found = true;
        //             var matched_item = {
        //                 match_found: true
        //             }

        //             // Update the adjacent item
        //             LostItem.findByIdAndUpdate(item_matched._id, matched_item, {}, function(err){
        //                 if (err) {
        //                     var err = new Error('Sorry An Error Occurred');
        //                     err.status = 500;
        //                     console.log('Error updating the fucking file ');
        //                     return next(err);
        //                 }
        //                 console.log("****----ItemController: Update Found Item match_found to be : "+item_matched.match_found+"\n \n");
        //             });
        //         }
        //         // Save the object after checking for match
        //         found_item.save(function (err){
        //             if (err){
        //                 var err = new Error("Unable to save item");
        //                 err.status = 500;                        
        //                 return res.render('found_item_form', {
        //                     title: "Found",
        //                     company: "MoFound NG",             
        //                     error: err
        //                 });
        //             }                    
        //             console.log("ItemController: Saving the item, to start matching.");
        //             res.redirect('/admin/founds');
        //         });
                                
        // });        
        // // successful -redirect to new item detail
        // return res.redirect(lost_item.url);
    }
];

// Handle lostItem create on POST.
exports.lost_item_create_post = [
    body('name').isLength({ min: 1 }).trim().withMessage("Item's name is required"),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!').isMobilePhone().withMessage('Reporter takes only phone number'),
    // body('category').equals(!'-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),
    
    // handle the req, and res and next
    (req, res, next) => {
        createObject("Lost", req, res, LostItem, FoundItem, "admin_create_lost", next);
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
    deleteObject("Found", req, res, FoundItem, LostItem, "admin_found_delete");
};

// Handle lostItem delete on POST.
exports.lost_item_delete_post = function(req, res) {
    // Success
    deleteObject("Lost", req, res, LostItem, FoundItem, "admin_lost_delete");
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
        updateObject("Found", req, res, FoundItem, LostItem, "admin_update_found_form", next);
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
        updateObject("Lost", req, res, LostItem, FoundItem, "admin_update_lost_form", next);
    }
    // res.send('NOT IMPLEMENTED: lostItem update POST '+req.params.id);
];





