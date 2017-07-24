var mongoose        = require('mongoose'),
    Whiteboard      = require("./models/whiteboard");

var io;
var socket;

module.exports.loadWhiteboard = function(sio, newSocket){
    io = sio;
    socket = newSocket;

    socket.on("room", function(room){
       console.log(room);
       socket.join(room);
       Whiteboard.findOne({"shortId": room}, function(err, whiteboard){
            if(err){
                console.log(err);
            } else {
                io.sockets.in(room).emit('boardState', whiteboard.savedCanvas);
            }
       });
    });

    socket.on("update", function(data){
        let room = data.room;
        let boardState = data.JSON;

        //update the board for everyone else connected to the same room
        io.sockets.in(room).emit('boardState', boardState);

        //update the stored canvas in the database
        Whiteboard.findOne({"shortId": room}, function(err, whiteboard){
            if(err){
                console.log(err);
            } else {
                whiteboard.savedCanvas = boardState;
                whiteboard.save();
            }
        });
    });
};
