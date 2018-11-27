// The Found Schema used in generating the found item model, to store items information

// Require Mongoose
var mongoose = require('mongoose');

// Define a schema
var Schema = mongoose.Schema;

var FoundSchema = new Schema(
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
        detail: {
            type: String,
            minlength: 1,
            default: "A "+this.major_color+" "+this.brand+""+this.name
        }, 
        image: {
            type: String
        },
        reporter:{type: String, default: 'Unknown'},
        location: {
            type: String,
            default: 'Unspecified'
        },
        status: {
            type: String,
            enum: ['B', 'NB', 'R'],
            default: 'NB'
        },
        code: {
            type: String,
            unique: true
        }
    }
);

//--- Virtual methods

// Virtual for user name
FoundSchema.virtual('getName')
    .get(function(){
        return this.name;
    });
FoundSchema.virtual('url')
    .get(function(){
        return '/item/found/'+this._id;
    });
FoundSchema.virtual('getCode')
    .get(function(){
        return '/item/found/'+this.code;
    });
FoundSchema.virtual('generateCode')
    .get(function(){
        this.code = randomize('0Aa', 7);
    });


// Compile the model from schema
module.exports = mongoose.model('Found', FoundSchema);