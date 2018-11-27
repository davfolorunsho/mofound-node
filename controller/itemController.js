var async = require('async');
// var crypto = require('crypto');

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
        console.log("showing "+results.lost_item);
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

exports.found_item_code_get = function(req, res) {
    res.send('NOT IMPLEMENTED: FoundItem with code '+ req.params.code);
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
            detail: req.body.detail,
            image: req.body.image,
            reporter: getUnregUser(req.body.phone),
            status: req.body.status,
            code: generateCode()
        });

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
            // Save the item first
            // item.save(function (err){
            //     if (err) {return next(err); }
            // });
            found_item.save(function (err) {
                if (err) { return next(err); }
                // Item is saved. Redirect to item detail page.
                res.redirect(found_item.url);
              });
        }
    }
] 
// {
//     res.send('NOT IMPLEMENTED: FoundItem create POST');
// };


// Display lostItem create form on GET.
exports.lost_item_create_get = function(req, res) {
    async.parallel({
        lost_count: function(callback){
            LostItem.count({}, callback);
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
            detail: req.body.detail,
            image: req.body.image,
            reporter: getUnregUser(req.body.phone),
            status: req.body.status,            
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again
            res.render('lost_item_form', {
                title: "Lost",
                company: "MoFound NG",             
                error: err, 
                data: results});
        }else{
            // Data from form is valid. save item
            lost_item.save(function (err){
                if (err) {return next(err);}
                // successful -redirect to new item detail
                res.redirect(lost_item.url);
            });
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


