var express = require('express');
var router = express.Router();
var indexController = require('../../controller/indexController');
// var adminController = require('../../controller/adminController');
var adminController = require('../../controller/adminController');

/* GET home page. */
router.get('/', adminController.index);

// List all found and lost items
router.get('/founds', adminController.found_item_list);
router.get('/losts', adminController.lost_item_list);

// Add a new found item
router.get('/found/new', adminController.found_item_create_get);
router.post('/found/new', adminController.found_item_create_post);

router.get('/lost/new', adminController.lost_item_create_get);
router.post('/lost/new', adminController.lost_item_create_post);

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

module.exports = router;
