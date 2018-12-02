// The User Schema used in generating the user model, to store users information

// Require Mongoose
var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

// Define a schema
var Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        name: {type: String, minlength:1, required:true},
        email: {type: String,unique:true, trim: true, minlength:1},
        phone: {type: String, minlength:1},
        hash: {type: String, minlength:1},
        salt: {type: String},
        date_of_birth: {type:Date},
        profile_pics: {type: String},
        isVerified: {type: Boolean, default: false}
    }
);

//--- Password methods
UserSchema.methods.setPassword = function(password) {
    console.log('To set password with '+password);
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

UserSchema.methods.validatePassword = function(password){
    console.log('To validate password with '+password);
    var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
}

UserSchema.methods.generateJWT =function() {
    console.log('To generate token');
    var today = new Date();
    var expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        email: this.email,
        name: this.name,
        phone: this.phone,
        date_of_birth: this.date_of_birth,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
}

UserSchema.methods.toAuthJSON = function() {
    return {
      _id: this._id,
      email: this.email,
      token: this.generateJWT(),
    };
  };

// Virtual for user name
UserSchema.virtual('user')
    .get(function(){
        return this.name;
    });
UserSchema.virtual('url')
    .get(function(){
        return '/mofound/user/'+this._id;
    });


// Compile the model from schema
module.exports = mongoose.model('User', UserSchema);