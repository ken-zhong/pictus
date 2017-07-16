var mongoose                    = require("mongoose");
var passportLocalMongoose       = require("passport-local-mongoose");
var shortid                     = require("shortid")

var WhiteboardSchema = new mongoose.Schema({
    _id: {
        type: String,
        "default": shortid.generate
    },
    savedCanvas: {type: String, default: '{"objects":[]}'},
    created: {type:  Date, default: Date.now}
    // owner: {
    //     id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "User"
    //     },
    //     username: String
    // }
});

module.exports = mongoose.model("Whiteboard", WhiteboardSchema);