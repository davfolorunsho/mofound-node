var async = require('async');
// var crypto = require('crypto');
var fs = require('fs');

var randomize = require('randomatic');
var stringSimilarity = require('string-similarity');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const company = 'Mofound';

// Models
var FoundItem = require('../model/found');
var LostItem = require('../model/lost');
var Admin = require('../model/admin');
var DropPointItem = require('../model/droppoint');

// Generate the Code
function generateCode(){   
    var rand = randomize('0Aa', 4);
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
        location: req.body.location,
        reporter: req.body.reporter,
        status: req.body.status,  
        isSpecial: req.body.is_special, 
        code: generateCode()    
    });

    // Check if file is included
    if (req.file){
        new_item.image =  {
            path: req.file.path,
            url: req.file.url,
            caption: req.file.originalname
        }
    }

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
                status: req.body.status,
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

exports.index = function(req, res, next){
    if (!req.user){
        // Requires authentication
        return res.redirect('/admin/login');
    }

    if (req.user.type === "drop_point" && req.user.droppoint){
        // Get the drop point attached to this user
        // console.log("The user :", req.user);
        // console.log("The user droppost :", req.user.droppoint);
        
        Admin.findById(req.user._id, function(err, admin_to_report){
            console.log("The admin here being considerred", admin_to_report);
            DropPointItem.findById(admin_to_report.droppoint, function(err, drop_point_to_use){
                if (err) res.send(err);
                var list_of_item = [];
                var all_boxed_item_count = 0;
                var matched_item_count = 0;
                var returned_item_count = 0;
                console.log("Current Drop point for ", admin_to_report.username," is " , drop_point_to_use.name);

                if (drop_point_to_use != null) {
                    for (var i=0; i < drop_point_to_use.items.length; i++){
                        console.log(drop_point_to_use.items[i]);
                        FoundItem.findById(drop_point_to_use.items[i], function(err, item){
                            list_of_item.push(item);
                            if (item.match_found){
                                matched_item_count = matched_item_count+1;
                            }
                            if (item.status === "Returned"){
                                returned_item_count = returned_item_count +1;
                            }
                            all_boxed_item_count = list_of_item.length;
                            console.log("Returned ",returned_item_count, " Matched ", matched_item_count)
                        })                        
                    }
                }
                console.log("This is the shiiiiiiiiiiiiiiit: ",drop_point_to_use);
                async.parallel({
                    the_drop_point: function(callback){
                        DropPointItem.findOne({"_id": admin_to_report.droppoint}, callback);
                    },
                    boxed_items_count: function(callback){
                        DropPointItem.countDocuments({"_id": admin_to_report.droppoint}, callback);
                    },
                    all_reported_lost: function(callback){
                        LostItem.countDocuments({}, callback);
                    }        
                }, function(err, results){
                    if(drop_point_to_use != null){
                        results.list_of_item = list_of_item;
                    }
                    if (err) {                        
                        console.log('Error occurred: '+err.message);
                        return next(err);
                    }
                    // Set the parameters 
                    results.matched_item_count = matched_item_count;
                    results.all_boxed_item_count = all_boxed_item_count;
                    results.returned_item_count = returned_item_count;
            
                    console.log('Test Returned shiits: ',results.the_drop_point);
                    res.render('droppoint_index', {
                        title: "Drop point",
                        company: "MoFound NG",             
                        error: err,
                        user: req.user, 
                        data: results});            
                })
                // return res.send("Done  here: "+list_of_item);
            })            
        })             
        return;   
    }else if (req.user.type == "technical"){
        // Make a call to get all neede info from db
        async.parallel({
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
                user: req.user,
                data: results});
        });
    }else{
        return res.send("You're not verified yet, Contact the admin to Open your account on 08031162141.");
    }

    
    // res.render('admin_index', {title: 'Admin'});
}

exports.loginGet = function(req, res) {
    res.render('login', {title: "Admin login"})
}
exports.login = function(req, res) {
    console.log("worked");
    res.redirect('/admin');
}
exports.logout = function(req, res){
    req.logout();
    console.log("User logged out")
    res.redirect('/admin/login');
  }
exports.registerGet = function(req, res) {
    async.parallel({
        all_drop_points: function(callback){
            DropPointItem.find({},callback);
        }
    }, function(err, result){
        res.render('register', {
            title: "New Admin",
            data: result
        });                
    })
    // res.send("register here");
}
exports.registerPost = function(req, res, next) {
    sanitizeBody('*').escape();
    // Extract validation and sanitization errors
    const errors = validationResult(req);
    // if there was error return the form
    if (!errors.isEmpty()){
        // There are errors. Render form again
        console.error('##Error: '+errors.array());
        return res.render('register', {
            title: "Register",
            company: "MoFound NG",             
            error: errors.array()
        });
    }
    
    var password = req.body.password;
    var password2 = req.body.cpassword;

    if (password == password2){
        var newAdmin = new Admin({
          username: req.body.username,
          email: req.body.email,
          phone: req.body.phone,
          type: req.body.type,          
        });
        
        newAdmin.setPassword(req.body.password);
        console.log("Got here too ");
        newAdmin.save(function (err){
            if (err){
                console.log(err.message);
                var err = new Error("Unable to save item");
                err.status = 500;                        
                return res.render('register', {
                    title: "Register",             
                    error: err
                });
            }  
            return res.send("Please Await your verification by the technical admin. After 24hrs you will be able to login to your admin page. ");                  
            // return res.redirect('/admin/login');
        });
      } else{
        res.status(500).send("{errors: \"Passwords don't match\"}");
      }
    // res.send("Hello");
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
        }        
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
exports.found_item_create_post = function(req, res, next){
    body('name').isLength({ min: 1 }).trim().withMessage("Item's name is required")
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!').isMobilePhone().withMessage('Reporter takes only phone number')
    body('location').optional()
    // body('category').equals(!'-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape()
    console.log("Untamperede @₦#₦#₦#₦#₦# "+ req.file)
    createObject("Found", req, res, FoundItem, LostItem, "admin_create_found", next);
}

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

exports.admin_create_get = function(req, res, next){
    res.send("Not implemented Get")
}
exports.admin_create = function(req, res, next){
    res.send("Not implemented Post")
}
exports.admin_update_get = function(req, res, next){
    res.send("Not implemented Get")
}
exports.admin_update = function(req, res, next){
    res.send("Not implemented Post")
}
exports.admin_read_get = function(req, res, next){

    Admin.find({}, function(err, all_admin){
        if(err){next(err)};
        res.render("admin_list", {
            title: "Admins",
            admins: all_admin,
            err: err
        })
    })
}
exports.admin_detail_get = function(req, res, next){
    res.send("Detail of the admin");
}

exports.admin_delete_get = function(req, res, next){
    res.send("Not implemented Get")
}

exports.admin_delete = function(req, res, next){
    res.send("Not implemented Post")
}

//  Post Routes
exports.post_create_get = function(req, res, next){
    async.parallel({
        list_of_admin: function(callback){
            Admin.find({}, callback);
        }

    }, function(err, results){
        res.render('post_create_form', {
            title: "Admin|Create Post",
            company: "MoFound NG", 
            data: results,
            error: err
        });
    })
    // res.send("Hello blah")
}
exports.post_create = function(req, res, next){
    body('name', "Item's name is required").isLength({ min: 1 }).trim();
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!').isMobilePhone().withMessage('Reporter takes only phone number');
    body('location').optional();

    sanitizeBody('*').escape();
    // Extract validation and sanitization errors
    const errors = validationResult(req);

    // if there was error return the form
    if (!errors.isEmpty()){
        // There are errors. Render form again
        console.error('VERBOSE: ItemController.js - Error Submitting form: '+errors.array());
        return res.render('post_create_form', {
            title: "Admin| Create Post",
            company: "MoFound NG",             
            error: errors.array()
        });
    }
    // console.log("Admin",drop_point_admin);
    var post = new DropPointItem({
        name: req.body.name,
        address: req.body.address,
        location : {
            longitude: req.body.longitude,
            latitude: req.body.latitude
        },
        items: undefined,
        admin: req.body.admin   
    });
    post.save(function(err, final_post){
        // Add this post to the Admin droppost by updating it
        if (err) res.send("Post Save: " +err.message);
        console.log("The post saved ", final_post);
        Admin.findOneAndUpdate({"_id": final_post.admin}, {$set: {droppoint: final_post._id,  isVerified: true}}, function(err, updated_admin){
            if (err) req.send("Admin Update: "+ err);
            console.log("The admin was updated too... ", updated_admin);
            res.redirect(post.url);
        })
        // res.redirect(post.url);
    })
    // Admin.findOne({id: req.body.admin}, function(err, drop_point_admin){
        
    // })
}

exports.post_add_new_item_get = function(req, res, next){
    res.render('post_add_item_form', {
        title: "Admin|Create Post",
        company: "MoFound NG"
    });
}
exports.post_add_new_item = function(req, res, next){
    async.parallel({
        found_item: function(callback){
            FoundItem.findOne({'code': req.body.code}).exec(callback);
        },
    }, function(err, results){
        if (err){ 
            var err = new Error('Item not found error');
            err.status = 404;
            return next(err);           
        }
        if (!results.found_item){ 
            // if both are not found
            var err = new Error('Item not is not registered, please register it first.');
            err.status = 406;
            return res.render('post_add_item_form', {
                title: 'Admin|Create Post',
                error: err
            });    
            // return res.redirect('/admin/post/add_new');
            // res.send(err.message)
        }else {
            var response = undefined;
            if (results.found_item != null){
                response = results.found_item;
                // console.log('Successful fetching of the data '+results.found_item._id);
                
                // Add this item to the list of item for this post:
                // Find and update the post item with this item.
                DropPointItem.findOneAndUpdate({"_id":req.user.droppoint}, {$push: {"items": response}}, function(err, droppoint){
                    console.log("The new Droppost: ", droppoint);
                    res.redirect('/admin');
                })
                // res.send("The user"+ req.user);
            }
            return;                      
        }
    })
    
    // res.send("To be implemented "+req.query.code+", "+req.body.code);
}
exports.post_update_get = function(req, res, next){
    res.send("Blah blah")
}
exports.post_update = function(req, res, next){
    res.send("Not implemented Post")
}
exports.post_read_get = function(req, res, next){
    DropPointItem.find({}, function(err, all_drop_points){
        if(err){next(err)};
        res.render("post_list", {
            title: "Admin|Posts",
            drop_points: all_drop_points,
            err: err
        })
    })
}
exports.post_detail_get = function(req, res, next){
    // async.ser({
    //     drop_point : function(callback){
    //         DropPointItem.findById(req.params.id, callback);
    //     },
    //     admin : function(callback){
    //         Admin.findById()
    //     }

    // }, function(err, results){

    // })
    DropPointItem.findById(req.params.id, function(err, drop_point){
        Admin.findById(drop_point.admin, function(err, admin){
            res.render("post_detail", {
                title: "Admin|"+drop_point.name,
                post: drop_point,
                admin: admin,
                error: err
            })
        })
    })
    // res.send("Detail of the post1- Detail");
}

exports.post_delete_get = function(req, res, next){
    res.send("Not implemented Get")
}
exports.post_delete = function(req, res, next){
    res.send("Not implemented Get")
}

exports.post_item_detail_get =function(req, res, next){
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
            'droppoint_item_detail', {
                title: results.found_item.name,
                company: "MoFound NG",             
                error: err,
                data: results
            });
    });
    //res.send("Not implemented yet: Post Item Get");
}

exports.post_item_update_get =function(req, res, next){       
    res.send("Not implemented yet: update Item Get");
}
exports.post_item_update =function(req, res, next){
    res.send("Not implemented yet: update Item Post");
}

exports.post_item_delete_get =function(req, res, next){
    async.parallel({
        found_item: function(callback) {
            FoundItem.findById(req.params.id).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.found_item==null) { // No results.
            res.redirect('/admin');
        }
        // Successful, so render.
        res.render('droppoint_item_delete', { title: results.found_item.name, data: results});
    }); 
    // res.send("Not implemented yet: Delete Item Get");
}
exports.post_item_delete =function(req, res, next){
    // res.send("Not implemented yet: delete Item Post");
    // deleteObject("Found", req, res, FoundItem, LostItem, "admin_index");
    FoundItem.findById(req.params.id, function(err, item_to_delete){
        if(err){
            console.error(err);
            return next(err);
        }
        if(item_to_delete.match_found){
            LostItem.findOneAndRemove({"_id":item_to_delete.matched_item}, function(err, updated_item_delete){
                console.log("An item was removed");
            })
        }

        DropPointItem.findOneAndUpdate({"_id": req.user.droppoint}, {$pull: {"items": req.params.id}}, function(err, updated_drop_point){
            console.log("The drop point being considered ", updated_drop_point);

            FoundItem.findOneAndRemove({"_id": req.params.id}, function(err){
                if(err){
                    console.error(err);
                    return next(err);
                }
                console.log("Item Deleted ")
                res.redirect('/admin');
            });
        })

        // Admin.findById(req.user._id, function(err, admin_to_report){
        //     console.log("The drop point being considerred is id: ", admin_to_report.droppoint);
        //     async.parallel([
        //         function(callback){
        //             DropPointItem.findOneAndUpdate({"_id": admin_to_report.droppoint}, {
        //                 $pull: {"items": req.params.id}}, callback);
        //         },
        //         // function(callback){
        //         //     DropPointItem.findOneAndUpdate({"_id": admin_to_report.droppoint}, {
        //         //         $pull: {"items": req.params.id}}, callback);
        //         // }

        //     ], function(err, response){
        //         FoundItem.findByIdAndRemove(req.params.id, function(err){
        //             if(err){
        //                 console.error(err);
        //                 return next(err);
        //             }
        //             console.log("Item Deleted ")
        //             res.redirect('/admin');
        //         });

        //     })
            // DropPointItem.findOneAndUpdate({"_id": admin_to_report.drop_point}, {
            //     $pull: {"items": req.params.id}}, function(err, updated_drop_point){

            //     })
            // DropPointItem.findOneAndUpdate({"_id": admin_to_report.drop_point}, {
            //         $pull: {"items": req.params.id}}, function(err, updated_drop_point){ 
            //             console.log(updated_drop_point);   
            //     })
                
            // DropPointItem.findByIdAndUpdate(admin_to_report.droppoint, { "$pull": { items: {"_id": item_to_delete._id}}} ,function(err, drop_point_to_use){
            //     console.log(drop_point_to_use);
                
            // })
    });
        
// res.send("Delete post");
}









