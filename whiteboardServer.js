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
       Whiteboard.findById(room, function(err, whiteboard){
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
        
        Whiteboard.findByIdAndUpdate(room, {savedCanvas: boardState}, function(err, board){
            if(err || !board){
                console.log(err);
            } else {
                io.sockets.in(room).emit('boardState', boardState);
            }
        });
        
    });

};
