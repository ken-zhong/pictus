var mongoose                    = require("mongoose");
var passportLocalMongoose       = require("passport-local-mongoose");
var shortid                     = require("shortid")

var WhiteboardSchema = new mongoose.Schema({
    _id: {
        type: String,
        "default": shortid.generate
    },
    savedCanvas: {type: String, default: '{"objects":[]}'},
    onwer: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Whiteboard", WhiteboardSchema);