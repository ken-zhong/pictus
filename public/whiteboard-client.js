var canvas = new fabric.Canvas("draw");
var socket = io();
var boardId = window.location.pathname.slice(8);

canvas.set("isDrawingMode", "true");
canvas.freeDrawingBrush.width = 2;

var app = {
    init: function(){
        socket.on('connect', function(){
          socket.emit('room', boardId);
        });
        
        socket.on('boardState', function(val){
          canvas.loadFromJSON(val);
        });
        
        canvas.on('path:created', function () {
          updateCanvas();
        });
    }
};

function updateCanvas(){
  var newData = {};
  newData.JSON = saveCanvas();
  newData.room = boardId;
  socket.emit('update', newData); 
}

function drawMode(){
  canvas.isDrawingMode = !canvas.isDrawingMode;
}

function changeBrushColor(color){
  canvas.freeDrawingBrush.color = color;
  canvas.freeDrawingBrush.width = 2;
}

function changeToEraser(){
  canvas.freeDrawingBrush.color = 'white';
  canvas.freeDrawingBrush.width = 90;
}

function resetCanvas(){
  canvas.loadFromJSON('{"objects":[]}');
  updateCanvas();
}

function saveCanvas(){
  return JSON.stringify(canvas);
}

app.init();