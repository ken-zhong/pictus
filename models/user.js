var mongoose                    = require("mongoose");
var passportLocalMongoose       = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    boards: [
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Whiteboard"
        }    
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);    
