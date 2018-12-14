// The Found Schema used in generating the found item model, to store items information

// Require Mongoose
var mongoose = require('mongoose');

// Define a schema
var Schema = mongoose.Schema;

var LostSchema = new Schema(
    {
        name: {
            type: String, 
            required: [true, 'You must specify the name']
        },        
        category: {
            type: String,
            // enum: ['Documents', 'Household','Religous', 'Bottled Products', 'Others' ]
        },
        brand: {
            type: String,
            minlength: [1, 'Brand should exceed 1 character'],

        },
        major_color: {
            type: String,
        },
        size_group :{
            type: String,
            // enum: ['XL', 'L', 'M', 'S', 'XS', 'Others']
        },
        other_info: {
            type: String,
        },
        detail: {
            type: String,
            unique: true
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
            enum: ['Boxed', 'Not Boxed', 'Returned'],
            default: 'Not Boxed'
        },
        code: {
            type: String,
            unique: true
        },
        match_found: {
            type: Boolean,
            default: false
        },
        receiver_code: {
            type: String,
        }
    }
);
//--- Virtual methods
LostSchema.methods.makeDetail = function(){
    this.detail = this.major_color+" "+this.brand+" "+this.name+" and "+this.other_info+" in "+this.category+" category.";
    return;
}

// Virtual for user name
LostSchema.virtual('getName')
    .get(function(){
        return this.name;
    });
LostSchema.virtual('url')
    .get(function(){
        return '/item/lost/'+this._id;
    });
LostSchema.virtual('genDetail')
    .get(function(){
        this.detail = this.major_color+" "+this.brand+" "+this.name+" and "+this.other_info+" in "+this.category+" category.";
        return this.makeDetail();
        // return;
    });
LostSchema.virtual('generateCode')
    .get(function(){
        this.code = randomize('0Aa', 7);
    });


// Compile the model from schema
module.exports = mongoose.model('Lost', LostSchema);