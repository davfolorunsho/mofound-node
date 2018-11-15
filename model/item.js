// The Item Schema used in generating the item model, to store items information

// Require Mongoose
var mongoose = require('mongoose');

// Define a schema
var Schema = mongoose.Schema;

var ItemSchema = new Schema(
    {
        name: {
            type: String,
            minlength:[2, 'Name must be more than 2 character'],
            maxlength: [50, 'Name should not exeed 50 Characters'], 
            required: [true, 'You must specify the name']
        },
        details: {
            type: String,
            minlength: 1,
        },
        category: {
            type: String,
            enum: ['Documents', 'Household','Religous', 'Bottled Products', 'Others' ]
        }, 
        image: {
            type: String
        }
    }
);

//--- Virtual methods

// Virtual for user name
ItemSchema.virtual('getName')
    .get(function(){
        return this.name;
    });
    ItemSchema.virtual('url')
    .get(function(){
        return '/mofound/user/'+this._id;
    });


// Compile the model from schema
module.exports = mongoose.model('Item', ItemSchema);