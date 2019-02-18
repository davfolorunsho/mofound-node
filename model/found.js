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
            // enum: ['Documents', 'Household','Religious', 'Bottled', 'Electronic', 'Others' ]
        },
        brand: {
            type: String,
            minlength: [1, 'Brand should exceed 1 character'],
            default: 'Unbranded'
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
            unique:true
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
        matched_item: {
            type: Schema.Types.ObjectId, 
            ref: "Lost"
        },
        droppoint: {
            type: Schema.Types.ObjectId,
            ref: "DropPoint"
        },
        date_of_reg: {type:Date, default: Date.now()},
    }
);

//--- Virtual methods

FoundSchema.methods.makeDetail = function(){
    this.detail = this.major_color+" "+this.brand+" "+this.name+" and "+this.other_info+" in "+this.category+" category";
}

// Virtual for user name
FoundSchema.virtual('getName')
    .get(function(){
        return this.name;
    });
FoundSchema.virtual('url')
    .get(function(){
        return '/item/found/'+this._id;
    });
FoundSchema.virtual('admin_url')
    .get(function(){
        return '/admin/found/'+this._id;
    });
FoundSchema.virtual('getMatchedId')
    .get(function(){
        return this.matched_item[0]._id;
    });
FoundSchema.virtual('setDetail')
    .get(()=>{
        return this.major_color+" "+this.brand+" "+this.name+" and "+this.other_info+" in "+this.category+" category";
    })
FoundSchema.virtual('generateCode')
    .get(function(){
        this.code = randomize('0Aa', 7);
    });


// Compile the model from schema
module.exports = mongoose.model('Found', FoundSchema);