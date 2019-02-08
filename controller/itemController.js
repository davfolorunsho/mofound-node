var async = require('async');
var fs = require('fs');
// var crypto = require('crypto');
var stringSimilarity = require('string-similarity');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const company = 'Mofound';
const shareFacebook = require('share-facebook');
const shareTwitter = require('share-twitter')
const APP_ID1 = "408612589885188";
const APP_ID = "108294790302517";
const QUOTE_TO_SEND = 'I just reported my lost item on mofoundfyp.herokuapp.com, you might be the finder of this my item, you can also report it on mofound.com or contact 08031162141 to help me get my item back';

var FoundItem = require('../model/found');
var LostItem = require('../model/lost');
var Item = require('../model/item');

var User = require('../model/user');
var randomize = require('randomatic');

// Generate the Code
function generateCode(){   
    var rand = randomize('0Aa', 7);
    genCode = rand;
    return rand;
}

// Generate Receiver code for matched item
function generateReceiverCode(){
    var rand = randomize('0A', 16);
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
                return res.redirect(new_item.url);
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
                        res.redirect(updated_items.base_item_update.url);                            
                    })
                }else{
                    // No match was found for match_check
                     
                    adjacentObjectSchema.findByIdAndUpdate(results.base_item_raw_update.matched_item, {"$set": {match_found: false, matched_item: undefined}}, function (err, params) {
                        console.log("Update......................");
                        ObjectSchema.findByIdAndUpdate(req.params.id, {"$set": {match_found: false, matched_item: undefined}}, function(err){
                            if (err) {
                                return next(err);
                            }
                            res.redirect(results.base_item_raw_update.url);                            
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
        res.redirect('/');
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
const Geo = require('geo-nearby');
const data = [
    [-35.30278, 149.14167, 'Hezekiah Oluwasanmi Library'],
    [-33.86944, 151.20833, 'OAU Senate'],
    [-37.82056, 144.96139, 'Forks & Finger, OAU'],
    [-34.93333, 138.58333, 'White House, OAU'],
    [-27.46778, 153.02778, 'Yellow House, OAU'],
    [-31.95306, 115.85889, 'Social Sciences']
  ];

// Display detail page for a specific found item.
exports.found_item_detail = function(req, res, next) {
    var shareurl =  shareFacebook({
        quote: QUOTE_TO_SEND,
        url: 'https://https://mofoundfyb.herokuapp.com//',
        redirect_uri: 'https://mofoundfyb.herokuapp.com/',
        hashtags: "#mofound",
        app_id: APP_ID
      });
    var twittershare = shareTwitter({
        text: 'Check this library to help you create share twitter url',
        url: 'https://github.com/bukinoshita/share-twitter'
      })
      const dataSet = Geo.createCompactSet(data);
      const geo = new Geo(dataSet, { sorted: true });
       
      geo.nearBy(-33.87, 151.2, 5000);
     
    var location = geo.nearBy(-33.87, 151.2, 50000);
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
            'found_item_detail', {
                title: results.found_item.name,
                company: "MoFound NG",             
                error: err,
                shareurl: shareurl,
                twittershare,
                location: location,
                data: results
            });
    });
    // res.send('NOT IMPLEMENTED: FoundItem detail: ' + req.params.id);
};

// Display detail page for a specific lost item.
exports.lost_item_detail = function(req, res,next) {
    var shareurl =  shareFacebook({
        quote: QUOTE_TO_SEND,
        url: 'https://https://mofoundfyb.herokuapp.com//',
        redirect_uri: 'https://mofoundfyb.herokuapp.com/',
        hashtags: "#mofound",
        app_id: APP_ID
      });
    var twittershare = shareTwitter({
        text: 'Check this library to help you create share twitter url',
        url: 'https://github.com/bukinoshita/share-twitter'
      })
      const dataSet = Geo.createCompactSet(data);
      const geo = new Geo(dataSet, { sorted: true });
       
      geo.nearBy(-33.87, 151.2, 5000);
     
    var location = geo.nearBy(-33.87, 151.2, 50000);
    // Get the item from the id
    async.parallel({
        lost_item: function(callback) {
            LostItem.findOne({'_id': req.params.id}).exec(callback);
        },
        
    }, function(err, results){
        if (err) {return next(err); }

        if (results.lost_item == null){
            // No result was found
            var err = new Error('Item not found error');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        console.log("showing "+results.lost_item.detail);
        res.render(
            'lost_item_detail', {
                title: results.lost_item.name,
                company: "MoFound NG",             
                error: err,
                shareurl: shareurl,
                twittershare,
                location: location,
                data: results
            });
    });
    // res.send('NOT IMPLEMENTED: LostItem detail: ' + req.params.id);
};

exports.found_item_code_get = function(req, res, next) {
    async.parallel({
        found_item: function(callback){
            FoundItem.findOne({'code': req.query.code}).exec(callback);
        },
        lost_item: function(callback) {
            LostItem.findOne({'code': req.query.code}).exec(callback);
        }
    }, function(err, results){
        if (err){ 
            var err = new Error('Item not found error');
            err.status = 404;
            return next(err);           
            // return res.status(404).render('index', {
            //     title: 'Home',
            //     error: err
            // });
        }
        if (results.found_item == null && results.lost_item == null){ 
            // if both are not found
            var err = new Error('Item not is not registered, please register it first.');
            err.status = 406;
            return res.render('auth_index', {
                title: 'Home',
                error: err
            });            
            
            // return res.redirect('/');
        }else {
            var response = null;
            if (results.found_item != null){
                response = results.found_item;
                console.log('Successful fetching of the data '+results.found_item._id);
                return res.redirect('/item/found/'+results.found_item._id);
            }
            if (results.lost_item != null){
                response = results.lost_item;
                console.log('Successful fetching of the data '+results.lost_item._id);
                return res.redirect('/item/lost/'+results.lost_item._id);
            }
                      
        }
        console.log('Successful fetching of the data.');
    });
    
}
exports.found_item_code_post = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem code POST' );
}

// Display foundItem create form on GET.
exports.found_item_create_get = function(req, res, next) {
    // Make a call to get all count for the objects
    async.parallel({
        user_count: function(callback){
            FoundItem.count({}, callback);
        },
        // gen_code: function(){
        //     return ;
        // },
        
        
    }, function(err, results){
        if (err) {
            console.log('Error occurred: '+err);
            next(err);
        }

        // console.log('Done pulling: '+results);
        res.render('found_item_form', {
            title: "Found",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
    // res.send('NOT IMPLEMENTED: FoundItem create GET');
};


exports.found_item_create_post = [
    body('name').isLength({ min: 1 }).trim().withMessage("Item's name is required"),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!').isMobilePhone().withMessage('Reporter takes only phone number'),
    body('location').optional(),
    // body('category').equals(!'-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),
    
    // handle the req, and res and next
    (req, res, next) => {
        createObject("Found", req, res, FoundItem, LostItem, 'found_item_form', next);
    }
]

// Display lostItem create form on GET.
exports.lost_item_create_get = function(req, res) {
    
    // If user is not authenticated yet
    // if (!auth){
    //     redirect('/users/login');
    // }else{

    // }
    
    async.parallel({
        lost_count: function(callback){
            FoundItem.count({}, callback);
        },      
        
    }, function(err, results){
        if (err) console.err('Error occurred: '+err);

        // console.log('Done pulling: '+results);
        res.render('lost_item_form', {
            title: "Lost",
            company: "MoFound NG",             
            error: err, 
            data: results});
    });
    // res.send('NOT IMPLEMENTED: LostItem create GET');
};


// Handle lostItem create on POST.
exports.lost_item_create_post = [
    body('name').isLength({ min: 1 }).trim().withMessage("Item's name is required"),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!').isMobilePhone().withMessage('Reporter takes only phone number'),
    body('location').isAlphanumeric().withMessage("Location should be alpa-numeric"),
    // body('category').equals('-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),
    
    // handle the req, and res and next
    (req, res, next) => {
        createObject("Lost", req, res, LostItem, FoundItem, "lost_item_form", next);        
    }
]

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
        res.render('found_item_update_form', {
            title: "Found",
            company: "MoFound NG",             
            error: err,
            data: results
        });
    });
    // res.send('NOT IMPLEMENTED: FoundItem update GET '+req.params.id);
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
        res.render('lost_item_update_form', {
            title: "Lost",
            company: "MoFound NG",             
            error: err,
            data: results
        });
    });
    // res.send('NOT IMPLEMENTED: LostItem update GET '+req.params.id);
};


exports.found_item_update_post = [
    body('name', "Item's name is required").isLength({ min: 1 }).trim(),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!').isMobilePhone().withMessage('Reporter takes only phone number'),
    // body('category').equals('-select-').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),

    (req, res, next) => {
        updateObject('Found', req, res, FoundItem, LostItem, 'found_item_update_form', next);
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

        updateObject("Lost", req, res, LostItem, FoundItem, "lost_item_update_form", next);
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
            res.redirect('/item/found/'+req.params.id);
        }
        // Successful, so render.
        res.render('found_delete', { title: results.found_item.name, data: results});
    });
    // res.send('NOT IMPLEMENTED: FoundItem delete GET '+req.params.id);
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
            res.redirect('/item/lost/'+req.params.id);
        }
        // Successful, so render.
        res.render('lost_delete', { title: results.lost_item.name, data: results});
    });
};

// Handle foundItem delete on POST.
exports.found_item_delete_post = function(req, res, next) {
    deleteObject('Found', req, res, FoundItem, LostItem, null);
    // res.send('NOT IMPLEMENTED: foundItem delete POST');
};

// Handle lostItem delete on POST.
exports.lost_item_delete_post = function(req, res) {
    deleteObject('Lost', req, res, LostItem, FoundItem, null);
};



