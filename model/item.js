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
        category: {
            type: String,
            enum: ['Documents', 'Household','Religous', 'Bottled Products', 'Others' ]
        },
        brand: {
            type: String,
            minlength: [1, 'Brand should exceed 1 character'],

        },
        major_color: {
            type: String,
            enum: ['Blue', 'Red', 'White', 'Black', 'Green','Yellow', 'Pink', 'Purple', 'Others']
        },
        size_group :{
            type: String,
            enum: ['XL', 'L', 'M', 'S', 'XS', 'Others']
        },
        details: {
            type: String,
            minlength: 1,
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