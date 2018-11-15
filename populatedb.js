#! /usr/bin/env node

console.log('This script populates some test users, items, foundItem and lostItem to your database. Specified database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
if (!userArgs[0].startsWith('mongodb://')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return;
}

var async = require('async');

var User = require('./model/user');
var Item = require('./model/item');
var LostItem = require('./model/lostItem');
var FoundItem = require('./model/foundItem');


var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

var users = [];
var items = [];
var lostItems = [];
var foundItems = [];


// Create a new user
function createUser(fname, email, phone, password, dob, profile_pics, isVerified, cb){
    userdetail = {fisrtname: fname, email: email, phone: phone};
    
    if (dob != false) userdetail.date_of_birth = dob;
    if (password != false) userdetail.password = password;
    if (profile_pics != false) userdetail.profile_pics = profile_pics;                                     
    if (isVerified != false) userdetail.isVerified = isVerified;

    var user = new User(userdetail);
    user.save(function(err){
      if (err){
        cb(err, null);
        return;
      }
      console.log("User Added: "+ user.firstname);
      users.push(user);
      cb(null, user);
    });
};

// Create items
function createItem(name, details, category, image, cb){
  itemdetail = {name: name, details: details, category: category};
  if(image != image) itemdetail.image = image; 

  var item = new Item(itemdetail);
  item.save(function(err){
    if (err){
      cb(err, null);
      return;
    }
    console.log('Item Created: '+itemdetail.name);
    items.push(item);
    cb(null, item);
  });
}

// Create foundItem
function createFoundItem(item, reporter, status, code, cb){
  foundItemdetails = {item: item,reporter: reporter, status: status, code: code};
  if (code != false) foundItemdetails.code = code;
  if (status != false) foundItemdetails.status = status;
  
  var foundItem = new FoundItem(foundItemdetails);
  foundItem.save(function(err){
    if(err){
      cb(err, null);
      return;
    }
    console.log('FoundItem Created by '+foundItemdetails.reporter.firstname);
    foundItems.push(foundItem);
    cb(null, foundItem);
  });

}

// Create lostItem
function createLostItem(item, reporter, status, code, cb){
  lostItemdetails = {item: item,reporter: reporter, status: status, code: code};
  if (code != false) lostItemdetails.code = code;
  
  var lostItem = new LostItem(lostItemdetails);
  lostItem.save(function(err){
    if(err){
      cb(err, null);
      return;
    }
    console.log('Lost Item Created by '+lostItem.reporter.firstname);
    lostItems.push(lostItem);
    cb(null, lostItem);
  });

}

function getStatus(){
  var store = "";
  for(i=0; i>10; i++){
        
  }
  return store;
}
// ---- Start creating mock data ---- ////

// 4 users
function usersCreate(cb){
  async.parallel([
    function(callback){
      createUser("John", 'johnmendel@gmail.com', '08000000000', false, false, false, true, callback);
    },
    function(callback){
      createUser("Micheal", 'michealdrake@gmail.com', '08000000001', false, false, false, true, callback);
    },
    function(callback){
      createUser("Mary", 'maryklen@gmail.com', '08000000002', false, false, false, true, callback);
    },
    function(callback){
      createUser("Steven", 'steveglen@gmail.com', '08000000003', false, false, false, true, callback);
    }
  ], cb);
}

// 2 Items
function itemsCreate(cb){
  async.parallel([
    function(callback){
      createItem('Stainless Cooler', 'An ash colored stainless cooler with intact handle', 'Household', false, callback);
    },
    function(callback){
      createItem('Electric Touch', 'A red and rechargable touch, small sized', 'Household', false, callback);
    },
    function(callback){
      createItem('Phone Battery', 'A battery for infinix Hot 4', 'Others', false, callback);
    }
  ], cb);
}

function foundItemsCreate(cb) {
  async.parallel([
    function(callback){
      createFoundItem(items[0], users[1], "NB", 'TST00860', callback);
    },
    function(callback){
      createFoundItem(items[1], users[0], "NB", 'TST00830', callback);
    },
    function(callback){
      createFoundItem(items[0], users[3], "NB", 'TST00866', callback);
    },
    function(callback){
      createFoundItem(items[0], users[3], "NB", 'TST00067', callback);
    }
  ], cb);
}

function lostItemsCreate(cb) {
  async.parallel([
    function(callback){
      createLostItem(items[0], users[1], "NB", 'TST01867', callback);
    },
    function(callback){
      createLostItem(items[1], users[0], "NB", 'TST09867', callback);
    },
    function(callback){
      createLostItem(items[0], users[3], "NB", 'TST06867', callback);
    },
    function(callback){
      createLostItem(items[2], users[2], "NB", 'TST05867', callback);
    }
  ], cb);
}

async.series([
    usersCreate,
    itemsCreate,
    lostItemsCreate,
    foundItemsCreate    
],
// Optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('Done: '+users);
    }
    // All done, disconnect from database
    mongoose.connection.close();
});







