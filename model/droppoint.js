// The Drop point Schema used in generating the Drop point item model, to store items information

// Require Mongoose
var mongoose = require('mongoose');

// Define a schema
var Schema = mongoose.Schema;

var DropPointSchema = new Schema(
    {
        name: {type: String},
        location:{
            longitude: {type: Number},
            latitude: {type: Number}
        },
        address: {type: String},
        items: [{
            type: Schema.Types.ObjectId,
            ref: "Found"
        }],
        admin: {
            type : Schema.Types.ObjectId,
            ref: "Admin",
        }
    }
);

//--- Virtual methods

// DropPointSchema.methods.makeDetail = function(){
//     this.detail = this.major_color+" "+this.brand+" "+this.name+" and "+this.other_info+" in "+this.category+" category";
// }

DropPointSchema.methods.addItem = function(item){
    this.items.push(item);
    return this.items;
}
DropPointSchema.methods.getLocation = function(){
    return [this.location.latitude, this.location.longitude, this.name];
}

// Virtual for user name
DropPointSchema.virtual('getName')
    .get(function(){
        return this.name;
    });
DropPointSchema.virtual('url')
    .get(function(){
        return '/admin/posts/'+this._id;
    });

DropPointSchema.virtual('latitude')
    .get(function(){
        return this.location.latitude;
    });
DropPointSchema.virtual('longitude')
    .get(function(){
        return this.location.longitude;
    });
DropPointSchema.virtual('sendname')
    .get(function(){
        return this.name;
    });

DropPointSchema.virtual('getlocation')
    .get(function(){
        return this.location.latitude, this.location.longitude, this.name;
    });


// Compile the model from schema
module.exports = mongoose.model('DropPoint', DropPointSchema);