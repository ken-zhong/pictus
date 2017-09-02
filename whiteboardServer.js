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
        var room = data.room;
        var boardState = data.JSON;
        
        //update the stored canvas in the database, check for flag to emit back board for deserialization
        if(data.refresh){
            io.sockets.to(room).emit('boardState', boardState); 
        }
        Whiteboard.findOne({"shortId": room}, function(err, whiteboard){
            if(err){
                console.log(err);
            } else {
                whiteboard.savedCanvas = boardState;
                whiteboard.save();
            }        
        });
    });
    
    socket.on("newPath", function(data){
        var room = data.room;
        var newPath = data.newPath
        //update the board for everyone else connected to the same room
        io.sockets.to(room).emit('newPath', newPath);
    });
};
