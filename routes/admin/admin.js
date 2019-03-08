var express = require('express');
var router = express.Router();
var indexController = require('../../controller/indexController');
// var adminController = require('../../controller/adminController');
var adminController = require('../../controller/adminController');
var passport = require('passport');

const multer  = require('multer')

var path = require('path')
var storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, './public/uploads/')
  },
  filename: (req, file, callback)=>{
    callback(null, file.originalname)
  }
})

var upload = multer({storage: storage,
  limits:{fileSize: 1000000},
  })

/* GET home page. */
router.get('/', adminController.index);
// router.get('/', adminController.index);

// Admin Authentications
router.get('/login', adminController.loginGet);
router.post('/login', passport.authenticate('local', { failureRedirect: '/admin/login' }), adminController.login);
router.get('/logout', adminController.logout);

router.get('/register',  adminController.registerGet);
router.post('/register', adminController.registerPost);

// List all found and lost items
router.get('/founds', adminController.found_item_list);
router.get('/losts', adminController.lost_item_list);

// Add a new found item
router.get('/found/new', adminController.found_item_create_get);
router.post('/found/new', upload.single('image'), adminController.found_item_create_post);
// router.post('/found/new', upload.single('image'), (req, res)=>{
//     console.log("₦₦#@@#₦₦#####################: ", req.file)
//     res.send("The file is expected here: "+req.file)
// });

router.get('/lost/new', adminController.lost_item_create_get);
router.post('/lost/new', upload.single('image'), adminController.lost_item_create_post);

// View a found and lost detail
router.get('/found/:id', adminController.found_item_detail);
router.get('/lost/:id', adminController.lost_item_detail);

// Update a found and lost detail
router.get('/found/:id/update', adminController.found_item_update_get);
router.get('/lost/:id/update', adminController.lost_item_update_get);

router.post('/found/:id/update', adminController.found_item_update_post);
router.post('/lost/:id/update', adminController.lost_item_update_post);

// Delete a user detail
router.get('/found/:id/delete', adminController.found_item_delete_get);
router.get('/lost/:id/delete', adminController.lost_item_delete_get);

router.post('/found/:id/delete', adminController.found_item_delete_post);

router.post('/lost/:id/delete', adminController.lost_item_delete_post);

// Admin Routes
router.get('/admins/all', adminController.admin_read_get);
router.get('/admin/:id/', adminController.admin_detail_get);

router.get('/admin/:id/update', adminController.admin_update_get);
router.post('/admin/:id/update', adminController.admin_update);


router.get('/admin/:id/delete', adminController.admin_delete_get);
router.post('/admin/:id/delete', adminController.admin_delete);

// Post routes
router.get('/posts/all', adminController.post_read_get);
router.get('/posts/:id', adminController.post_detail_get);

router.get('/post/add_item', adminController.post_add_new_item_get);
router.post('/post/add_item', adminController.post_add_new_item);

router.get('/post/new', adminController.post_create_get);
router.post('/post/new', adminController.post_create);

router.get('/post/:id/update', adminController.post_update_get);
router.post('/post/:id/update', adminController.post_update);

router.get('/post/:id/delete', adminController.post_delete_get);
router.post('/post/:id/delete', adminController.post_delete);


router.get('/post/item/:id', adminController.post_item_detail_get);

router.get('/post/item/:id/update', adminController.post_item_update_get);
router.post('/post/item/:id/update', adminController.post_item_update);

router.get('/post/item/:id/delete', adminController.post_item_delete_get);
router.post('/post/item/:id/delete', adminController.post_item_delete);

module.exports = router;
