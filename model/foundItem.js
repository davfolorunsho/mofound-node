// The Item Schema used in generating the item model, to store items information

// Require Mongoose
var mongoose = require('mongoose');

// Define a schema
var Schema = mongoose.Schema;

var FoundItemSchema = new Schema(
    {
        item: {type: Schema.Types.ObjectId, ref: "Item"},
        reporter:{type: Schema.Types.ObjectId, ref: "User"},
        location: {
            type: String
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
FoundItemSchema.virtual('itemKindAndStatus')
    .get(function(){
        return 'Found & '+this.status;
    });
FoundItemSchema.virtual('getCode')
    .get(function(){
        return this.code;
    });
FoundItemSchema.virtual('url')
    .get(function(){
        return '/mofound/found/'+this.item._id;
    });


// Compile the model from schema
module.exports = mongoose.model('FoundItem', FoundItemSchema);