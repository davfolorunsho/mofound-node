var express = require('express');
var router = express.Router();

var indexController = require('../../controller/indexController');
var itemController = require('../../controller/itemController');

var multer  = require('multer')
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
router.get('/', indexController.index);
router.get('/about', indexController.about_get);
router.get('/error', indexController.error_get);

router.get('/items', itemController.item_list);
router.get('/item/foundro/:id', itemController.found_item_detail_readonly);
router.get('/items/special', itemController.special_items_list_get);

// List all found and lost items
router.get('/item/founds', itemController.found_item_list);
router.get('/item/losts', itemController.lost_item_list);

// Add a new found item
router.get('/item/found/new', itemController.found_item_create_get);
router.post('/item/found/new', upload.single('image'), itemController.found_item_create_post);

// router.get('/item/lost/new', auth.required,itemController.lost_item_create_get);
// router.post('/item/lost/new', auth.required, itemController.lost_item_create_post);
router.get('/item/lost/new', itemController.lost_item_create_get);
router.post('/item/lost/new', upload.single('image'), itemController.lost_item_create_post);
// router.post('/item/lost/new', upload.single('image'), (req, res)=>{
//   res.send("The file is here "+req.file)
// });

// View a found and lost detail
router.get('/item/found/:id', itemController.found_item_detail);
router.get('/item/lost/:id', itemController.lost_item_detail);
router.get('/item/code/', itemController.found_item_code_get);
router.post('/item/code/', itemController.found_item_code_post);

// Update a found and lost detail
router.get('/item/found/:id/update', itemController.found_item_update_get);
router.get('/item/lost/:id/update', itemController.lost_item_update_get);


router.post('/item/found/:id/update', itemController.found_item_update_post);
router.post('/item/lost/:id/update', itemController.lost_item_update_post);

// Delete a item detail
router.get('/item/found/:id/delete', itemController.found_item_delete_get);
router.post('/item/found/:id/delete', itemController.found_item_delete_post);

router.get('/item/lost/:id/delete', itemController.lost_item_delete_get);
router.post('/item/lost/:id/delete', itemController.lost_item_delete_post);

module.exports = router;
