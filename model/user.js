// The User Schema used in generating the user model, to store users information

// Require Mongoose
var mongoose = require('mongoose');

// Define a schema
var Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        firstname: {type: String, minlength:1},
        email: {type: String,unique:true, trim: true, minlength:1},
        phone: {type: String, minlength:1},
        password: {type: String, minlength:1},
        date_of_birth: {type:Date},
        profile_pics: {type: String},
        isVerified: {type: Boolean, default: false}
    }
);

//--- Virtual methods

// Virtual for user name
UserSchema.virtual('user')
    .get(function(){
        return this.firstname;
    });
UserSchema.virtual('url')
    .get(function(){
        return '/mofound/user/'+this._id;
    });


// Compile the model from schema
module.exports = mongoose.model('User', UserSchema);