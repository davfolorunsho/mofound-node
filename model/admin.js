// The User Schema used in generating the user model, to store users information

// Require Mongoose
var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
// var bcrypt = require("bcrypt");

// Define a schema
var Schema = mongoose.Schema;

var AdminSchema = new Schema(
    {
        username: {type: String, minlength:1},
        type: {type: String, enum: ["technical", "drop_point", "other"], default: "drop point"},
        email: {type: String,unique:true, trim: true, minlength:1},
        phone: {type: String, minlength:1},
        hash: {type: String},
        salt: {type: String},
        date_of_reg: {type:Date, default: Date.now()},
        profile_pics: {type: String},
        droppoint: {
            type: Schema.Types.ObjectId,
            ref: "DropPoint"
        },
        isVerified: {type: Boolean, default: false}
    }
);

//--- Password methods

AdminSchema.methods.setPassword = function(password) {
    // console.log('To set password with '+password);
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    // console.log('@@@To Set password with salt: ',this.salt);
    // console.log('###- To Set password with hash: ',this.hash);
    return;
}

AdminSchema.methods.verifyPassword = function(password){    
    // console.log('@@@@ To verify with salt: ',this.salt);
    var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    // console.log('####The verified hash is ', hash);
    return this.hash === hash;
}

AdminSchema.methods.generateJWT =function() {
    console.log('To generate token');
    var today = new Date();
    var expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        email: this.email,
        username: this.username,
        phone: this.phone,
        date_of_birth: this.date_of_birth,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
}

AdminSchema.methods.toAuthJSON = function() {
    return {
      _id: this._id,
      email: this.email,
      token: this.generateJWT(),
    };
  };

// Virtual for user username
AdminSchema.virtual('user')
    .get(function(){
        return this.username;
    });
AdminSchema.virtual('url')
    .get(function(){
        return '/admin/user/'+this._id;
    });


// Compile the model from schema
module.exports = mongoose.model('Admin', AdminSchema);

// module.exports.createUser = function(newUser, callback){
//     bcrypt.genSalt(10, function(err, salt) {
//       bcrypt.hash(newUser.password, salt, function(err, hash) {
//         newUser.password = hash;
//         newUser.save(callback);
//       });
//     });
// }
// module.exports.createUser = function(newUser, callback){
//     console.log('To set password with '+newUser.password);
//     var salt = crypto.randomBytes(16).toString('hex');
//     this.password = crypto.pbkdf2Sync(newUser.password, salt, 1, 512, 'sha512').toString('hex');
//     newUser.password = this.password;
//     newUser.save(callback);
// }