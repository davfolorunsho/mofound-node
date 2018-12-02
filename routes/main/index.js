var express = require('express');
var router = express.Router();
var auth = require('../auth');
var mongoose = require('mongoose');

var passport = require('passport');

var indexController = require('../../controller/indexController');
var itemController = require('../../controller/itemController');
var userController = require('../../controller/userController');

/* GET home page. */
router.get('/', indexController.index);

router.get('/items', itemController.item_list);

// List all found and lost items
router.get('/item/founds', itemController.found_item_list);
router.get('/item/losts', itemController.lost_item_list);

// Add a new found item
router.get('/item/found/new', itemController.found_item_create_get);
router.post('/item/found/new', auth.optional, itemController.found_item_create_post);

// router.get('/item/lost/new', auth.required,itemController.lost_item_create_get);
// router.post('/item/lost/new', auth.required, itemController.lost_item_create_post);
router.get('/item/lost/new', auth.optional,itemController.lost_item_create_get);
router.post('/item/lost/new', auth.optional, itemController.lost_item_create_post);

// View a found and lost detail
router.get('/item/found/:id', itemController.found_item_detail);
router.get('/item/lost/:id', itemController.lost_item_detail);
router.get('/item/code/', itemController.found_item_code_get);
router.post('/item/code/', itemController.found_item_code_post);

// Update a found and lost detail
router.get('/item/found/:id/update', itemController.found_item_update_get);
router.get('/item/lost/:id/update', itemController.lost_item_update_get);


router.post('/item/found/:id/update', itemController.found_item_update_post);
router.post('/lost/:id/update', itemController.lost_item_update_post);

// Delete a item detail
router.get('/item/found/:id/delete', itemController.found_item_delete_get);
router.get('/item/lost/:id/delete', itemController.lost_item_delete_get);

router.post('/item/found/:id/delete', itemController.found_item_delete_post);
router.post('/item/lost/:id/delete', itemController.lost_item_delete_post);

module.exports = router;
