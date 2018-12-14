var async = require('async');
// var crypto = require('crypto');
var stringSimilarity = require('string-similarity');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const company = 'Mofound';

var FoundItem = require('../model/found');
var LostItem = require('../model/lost');
var Item = require('../model/item');

var User = require('../model/user');
var randomize = require('randomatic');

var genCode;

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

// Generate unregistered user
function getUnregUser(phone){
    var uuser = new User({
        firstname: "user-"+generateCode(),
        phone: phone
    }) 
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
exports.found_item_detail = function(req, res, next) {
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
                data: results
            });
    });
    // res.send('NOT IMPLEMENTED: FoundItem detail: ' + req.params.id);
};

// Display detail page for a specific lost item.
exports.lost_item_detail = function(req, res,next) {
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

// Handle foundItem create on POST.

exports.found_item_create_post = [
    body('name', "Item's name is required").isLength({ min: 1 }).trim(),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!'),
    body('location').optional(),
    body('category').isString('select').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),
    
    // handle the req, and res and next
    (req, res, next) => {
        // Extract validation and sanitization errors
        const errors = validationResult(req);

        // if there was error return the form
        if (!errors.isEmpty()){
            // There are errors. Render form again
            console.error('ItemController.js - Error Submitting form: '+errors.array());
            return res.render('found_item_form', {
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
                    return res.redirect(found_item.url);
                });
                                
        });        
        // // successful -redirect to new item detail
        // return res.redirect(lost_item.url);
    }
]

// exports.found_item_create_post = [
//     body('name', "Item's name is required").isLength({ min: 1 }).trim(),
//     body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!'),
//     body('location').optional(),
//     sanitizeBody('*').escape(),
    
//     // Process the request after validation and sanitization
//     (req, res, next) =>{
//         // Extact the validation errors
//         const errors = validationResult(req);
        
//         var found_item = new FoundItem({
//             name: req.body.name,
//             category: req.body.category,
//             brand: req.body.brand,
//             major_color: req.body.color,
//             size_group: req.body.size,
//             other_info: req.body.other_info,
//             image: req.body.image,
//             reporter: req.body.reporter,
//             status: req.body.status,
//             code: generateCode()
//         });
//         // Make the detail out
//         found_item.makeDetail();

//         if (!errors.isEmpty()) {
//             // There are errors. Render the form again with sanitized values/error messages.
//             console.log('Error occured: '+errors.array());
//             return res.render('found_item_form', 
//             { 
//                 title: 'Found', 
//                 found_item: found_item, 
//                 error: errors.array()
//             });
//         }else {
//             // Data from form is valid. Save the item
//             // Perform string similarity on the new entry to update matchfound before saving
//             console.log('Looking for match ...');
//             // Run a program to get all list of found item
//             async.parallel({
//                 lost_items: function(callback){
//                     LostItem.find({}, callback);
//                 }

//             }, function(err, response){
//                 if (err){
//                     console.log('Error fetching list of lost item ');
//                     return; 
//                 }
//                 var item_matched = checkForMatch(found_item.detail, response.lost_items);
    
//                 // if item is matched
//                 if (item_matched != null){
//                     // Item is matched, Notify the user/admin
//                     found_item.match_found = true;
//                     // TODO ---- Update the match found value of the match item
                    
//                     item_matched.match_found = true;
//                     console.log("Set found item matchfound to true: "+found_item.match_found);
//                     console.log("Set lost item matchfound to true: "+item_matched.match_found);
                    
//                     // Save the found item
//                     found_item.save(function (err){
//                         console.log("SAVE --- Match was found: ");
//                         if (err) {return next(err);}
//                         // successful -redirect to new item detail
//                         res.redirect(found_item.url);
//                     });

//                 }else{
//                     // Save the found item
//                     found_item.save(function (err){
//                         console.log("SAVE --- Match is not found: ");
//                         if (err) {return next(err);}
//                         // successful -redirect to new item detail
//                         res.redirect(found_item.url);
//                     });
//                     return;
//                 }
//                 // Todo comment out if successful
//                 // console.log(response.found_items[response.found_items.length-1]);                
//             });
//         }
//     }
// ] 
// {
//     res.send('NOT IMPLEMENTED: FoundItem create POST');
// };



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
    body('name', "Item's name is required").isLength({ min: 1 }).trim(),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!'),
    body('location').optional(),
    body('category').isString('select').withMessage('Select a category for item'),

    sanitizeBody('*').escape(),
    
    // handle the req, and res and next
    (req, res, next) => {
        // Extract validation and sanitization errors
        const errors = validationResult(req);

        // if there was error return the form
        if (!errors.isEmpty()){
            // There are errors. Render form again
            console.error('ItemController.js - Error Submitting form: '+errors.array());
            return res.render('lost_item_form', {
                title: "Lost",
                company: "MoFound NG",             
                error: errors.array()
            });
        }
        // No errors submitting form, proceed to saving the info
        // Create a lost object with escaped and trimmed
        var lost_item = new LostItem({
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
                err = new Error('Error fetching found items, please go home');
                err.status = 500;
                console.error("ItemController: Error fetching found items");
                return next(err);
            } 

            // For found items were returned
            console.log("ItemController: Start Matching the file");
            // Run a match test
            var item_matched = checkForMatch(lost_item.detail, found_items);
                // if the similarity is above 60%- send msg to admin/Notify the reporter
                if (item_matched != null){
                    // Item is matched, Notify the user/admin and update the lost items match_found value
                    lost_item.match_found = true;
                    
                    console.log("\n \n****---ItemController: Update Lost Item match_found to be : "+lost_item.match_found);
                    // Update the corresponding match_found value for matched item
                    item_matched.match_found = true;
                    
                    var matched_item = {
                        match_found: true
                    }
                    // Update the adjacent item
                    FoundItem.findByIdAndUpdate(item_matched._id, matched_item, {}, function(err){
                        if (err) {
                            var err = new Error('Sorry An Error Occured');
                            err.status = 500;
                            console.log('Error updating the fucking file ');
                            return next(err);
                        }
                        console.log("****----ItemController: Update Found Item match_found to be : "+item_matched.match_found+"\n \n");
                    });
                
                // Save the object after checking for match
                lost_item.save(function (err){
                    if (err){
                        console.error(err);
                        var err = new Error("Unable to save item");
                        err.status = 500;   
                        // Return form for error                     
                        return res.render('lost_item_form', {
                            title: "Lost",
                            company: "MoFound NG",             
                            error: err
                        });
                    }                    
                    console.log("ItemController: Saving the item, to start matching.");
                    return res.redirect(lost_item.url);
                });
                // return res.redirect(lost_item.url);  
            }else{
                 // Save the object after checking for match
                 lost_item.save(function (err){
                    if (err){
                        console.error(err);
                        var err = new Error("Unable to save item");
                        err.status = 500;   
                        // Return form for error                     
                        return res.render('lost_item_form', {
                            title: "Lost",
                            company: "MoFound NG",             
                            error: err
                        });
                    }                    
                    console.log("ItemController: Saving the item, to start matching.");
                    return res.redirect(lost_item.url);
                });
            }                         
        });        
        // // successful -redirect to new item detail
        // return res.redirect(lost_item.url);
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
        res.render('found_item_form', {
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
        res.render('lost_item_form', {
            title: "Lost",
            company: "MoFound NG",             
            error: err,
            data: results
        });
    });
    // res.send('NOT IMPLEMENTED: LostItem update GET '+req.params.id);
};

// Handle foundItem update on POST.
exports.found_item_update_post = [
    body('name', "Item's name is required").isLength({ min: 1 }).trim().isAlpha().withMessage('Name must be alphabet letters.'),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!'),
    body('location').optional(),
    body('category').isString('select').withMessage('Select a category for item'),

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
                detail: req.body.color+" "+req.body.brand+" "+req.body.name+" and "+req.body.other_info+" in "+req.body.category+" category."
            };

        if (!errors.isEmpty()){
            // error reload the page
            res.render('found_item_form', {
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
                res.redirect(the_item.url);
            });
        }
    }
    // res.send('NOT IMPLEMENTED: lostItem update POST '+req.params.id);
];

// Handle lostItem update on POST.
exports.lost_item_update_post = [
    body('name', "Item's name is required").isLength({ min: 1 }).trim().isAlpha().withMessage('Name must be alphabet letters.'),
    body('reporter').isLength({ min: 1 }).trim().withMessage('Phone Number should be entered!!!'),
    body('location').optional(),
    body('category').isString('select').withMessage('Select a category for item'),

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
                detail: req.body.color+" "+req.body.brand+" "+req.body.name+" and "+req.body.other_info+" in "+req.body.category+" category."
            };

        if (!errors.isEmpty()){
            // error reload the page
            res.render('lost_item_form', {
                title: "Lost",
                company: "MoFound NG",             
                error: errors.array(),
                data: results
            });            
        }else{
            LostItem.findByIdAndUpdate(req.params.id, lost_item, {}, function(err, the_item){
                if(err) {  
                    console.error('Error updating');                  
                    return next(err); 
                }
                the_item.genDetail;
                // Successful - redirect to the detail
                res.redirect(the_item.url);
            });
        }
    }
    // res.send('NOT IMPLEMENTED: lostItem update POST '+req.params.id);
];

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



