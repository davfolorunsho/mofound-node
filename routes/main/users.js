var express = require('express');
var router = express.Router();

user_controller = require('../../controller/userController');

/* GET users listing. */
router.get('/', user_controller.users);

// Add a new user
router.get('/new', user_controller.newUser);
router.post('/new', user_controller.newUserPost);

// View a user detail
router.get('/user/:id/detail', user_controller.userDetail);

// Update a user detail
router.get('/user/:id/edit', user_controller.updateUser);
router.post('/user/:id/edit', user_controller.updateUserPost);

// Delete a user detail
router.get('/user/:id/delete', user_controller.deleteUser);

module.exports = router;
