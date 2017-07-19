var mongoose                    = require("mongoose");
var shortid                     = require("shortid");

var WhiteboardSchema = new mongoose.Schema({
    shortId: {
        type: String,
        "default": shortid.generate
    },
    savedCanvas: {type: String, default: '{"objects":[]}'},
    created: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    name: {
        type: String,
        "default": "New Canvas"
    }
});

module.exports = mongoose.model("Whiteboard", WhiteboardSchema);