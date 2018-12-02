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
            console.log("Current Found Item: No "+i+"-"+other_detail);

            // Perform a stringSimilarity on the two strings
            var similarity = stringSimilarity.compareTwoStrings(new_detail, other_detail);
            console.log("Compared: "+new_detail+" --AGAINST-- \n "+other_detail);
            // Make similarity at 100%
            similarity_level = similarity * 100;
            if (similarity_level > 60){
                // if similarity is 
                console.log("Seems a match was found: "+similarity_level+"%");
                // Set match to be the item found to match
                match = item_array[i]; 
                console.log("Match found is "+match);               
            }else{
                console.log("A match was not found: "+similarity_level+"%");
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
        if (err) {return next(err);}

        if (results.found_item == null){
            // No result was found
            var err = new Error('Item not found error');
            err.status = 404;
            return err;
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
exports.lost_item_detail = function(req, res) {
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
            return err;
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
            FoundItem.findOne({'code':req.query.code}).exec(callback);
        }, 
    }, function(err, results){
        if (err){ 
            console.log('Error fetching the data');
            var err = new Error('Item not found error');
            err.status = 404;
            return err;
        }
        console.log('Successful fetching of the data '+results.found_item._id);
        res.redirect('/item/found/'+results.found_item._id);
    });
    
}
exports.found_item_code_post = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem code POST' );
}

// Display foundItem create form on GET.
exports.found_item_create_get = function(req, res) {
    // Make a call to get all count for the objects
    async.parallel({
        user_count: function(callback){
            FoundItem.count({}, callback);
        },
        // gen_code: function(){
        //     return ;
        // },
        
        
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

// Handle foundItem create on POST.
exports.found_item_create_post = [
    body('name', "Item's name is required").isLength({ min: 1 }).trim(),

    sanitizeBody('*').escape(),
    
    // Process the request after validation and sanitization
    (req, res, next) =>{
        // Extact the validation errors
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data
        // var item = new Item({
        //     name: req.body.name,
        //     category: req.body.category,
        //     brand: req.body.brand,
        //     major_color: req.body.color,
        //     size_group: req.body.size,
        //     detail: req.body.detail,
        //     image: req.body.image
        // });
        
        var found_item = new FoundItem({
            name: req.body.name,
            category: req.body.category,
            brand: req.body.brand,
            major_color: req.body.color,
            size_group: req.body.size,
            other_info: req.body.other_info,
            image: req.body.image,
            reporter: getUnregUser(req.body.phone),
            status: req.body.status,
            code: generateCode()
        });
        // Make the detail out
        found_item.makeDetail();

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            
            res.render('found_item_form', 
            { 
                title: 'Found', 
                found_item: found_item, 
                errors: errors.array()
            });
            return;
        }
        else {
            // Data from form is valid. Save the item
            // Perform string similarity on the new entry to update matchfound before saving
            console.log('Looking for match ...');
            // Run a program to get all list of found item
            async.parallel({
                lost_items: function(callback){
                    LostItem.find({}, callback);
                }

            }, function(err, response){
                if (err){
                    console.log('Error fetching list of lost item ');
                    return; 
                }
                var item_matched = checkForMatch(found_item.detail, response.lost_items);
    
                // if item is matched
                if (item_matched != null){
                    // Item is matched, Notify the user/admin
                    found_item.match_found = true;
                    // TODO ---- Update the match found value of the match item
                    
                    item_matched.match_found = true;
                    console.log("Set found item matchfound to true: "+found_item.match_found);
                    console.log("Set lost item matchfound to true: "+item_matched.match_found);
                    
                    // Save the found item
                    found_item.save(function (err){
                        console.log("SAVE --- Match was found: ");
                        if (err) {return next(err);}
                        // successful -redirect to new item detail
                        res.redirect(found_item.url);
                    });

                }else{
                    // Save the found item
                    found_item.save(function (err){
                        console.log("SAVE --- Match is not found: ");
                        if (err) {return next(err);}
                        // successful -redirect to new item detail
                        res.redirect(found_item.url);
                    });
                    return;
                }
                // Todo comment out if successful
                // console.log(response.found_items[response.found_items.length-1]);                
            });
        }
    }
] 
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


// Handle lostItem create on POST.
exports.lost_item_create_post = [
    // Validate the filds
    body("name", "Name must not be empty.").isLength({min: 1}),

    // Validate fields.
    sanitizeBody('*').escape(),

    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);       
        
        // Create a lost object with escaped and trimmed
        var lost_item = new LostItem({
            name: req.body.name,
            category: req.body.category,
            brand: req.body.brand,
            major_color: req.body.color,
            size_group: req.body.size,
            other_info: req.body.other_info,
            image: req.body.image,
            reporter: getUnregUser(req.body.phone),
            status: req.body.status,            
        });

        // Make the detail out
        lost_item.makeDetail();

        if (!errors.isEmpty()) {
            // There are errors. Render form again
            console.log('Error occurred: '+errors.array());
            res.render('lost_item_form', {
                title: "Lost",
                company: "MoFound NG",             
                error: errors
            });
            return;
        }else{
            // ----------------- TODO ---------- Perform string similarity on the new entry to update matchfound before saving
            console.log('Looking for match ...');
            // Run a program to get all list of found item
            async.parallel({
                found_items: function(callback){
                    FoundItem.find({}, callback);
                }

            }, function(err, response){
                if (err){
                    console.log('Error fetching list of found item ');
                    return; 
                }
                var item_matched = checkForMatch(lost_item.detail, response.found_items);
                // if the similarity is above 60%- send msg to admin/Notify the reporter
                if (item_matched != null){
                    // Item is matched, Notify the user/admin
                    lost_item.match_found = true;
                    item_matched.match_found = true;
                    console.log("Set lost item matchfound to true: "+lost_item.match_found);
                    console.log("Set found item matchfound to true: "+item_matched.match_found);
                    
                    // Save the found item
                    lost_item.save(function (err){
                        console.log("SAVE --- Match was found: ");
                        if (err) {return next(err);}
                        // successful -redirect to new item detail
                        res.redirect(lost_item.url);
                    });

                }else{
                    // Save the found item
                    lost_item.save(function (err){
                        console.log("SAVE --- Match is not found: ");
                        if (err) {return next(err);}
                        // successful -redirect to new item detail
                        res.redirect(lost_item.url);
                    });
                    return;
                }
                // Todo comment out if successful
                // console.log(response.found_items[response.found_items.length-1]);                
            });
            
            // Successful- check for match with Lost Item
            // Data from form is valid. save item
        }
    }
];

// function(req, res) {
//     res.send('NOT IMPLEMENTED: LostItem create POST');
// };


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
    res.send('NOT IMPLEMENTED: FoundItem update GET '+req.params.id);
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
exports.found_item_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: foundItem update POST');
};

// Handle lostItem update on POST.
exports.lost_item_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: lostItem update POST');
};



