var canvas = new fabric.Canvas("draw");
var socket = io();
var boardId = window.location.pathname.slice(8);

canvas.set("isDrawingMode", "true");
canvas.freeDrawingBrush.width = 1;
fabric.Object.prototype.selectable = false;

var app = {
    init: function(){
        socket.on('connect', function(){
          socket.emit('room', boardId);
        });
        
        socket.on('boardState', function(val){
          updateCanvas(val);
        });
        
        canvas.on('path:created', function(){
          sendCanvas();
        });
        
        canvas.on('object:modified', function(){
          sendCanvas();
        });
    }
};

function sendCanvas(){
  var newData = {};
  newData.JSON = saveCanvas();
  newData.room = boardId;
  socket.emit('update', newData); 
}

function updateCanvas(newCanvas){
  canvas.loadFromJSON(newCanvas);
  canvas._objects.forEach(function(element){
    if(element.type !== "path"){
      element.selectable = true;
    }
  });
}

function drawMode(){
  canvas.isDrawingMode = !canvas.isDrawingMode;
}

function changeBrushColor(color){
  canvas.freeDrawingBrush.color = color;
  canvas.freeDrawingBrush.width = 1;
}

function changeToEraser(){
  canvas.freeDrawingBrush.color = 'white';
  canvas.freeDrawingBrush.width = 90;
}

function resetCanvas(){
  canvas.loadFromJSON('{"objects":[]}');
  sendCanvas();
}

function saveCanvas(){
  return JSON.stringify(canvas);
}

function createToken(name){
  if(name.length > 2){
    name = name[0] + name[1]
  }
  
  var coordinates = randomCoordinates(500, 500);
  
  var circle = new fabric.Circle({
    radius: 20,
    fill: 'white',
    originX: 'center',
    originY: 'center',
    strokeWidth: 2,
    stroke: 'black'
  })

  var text = new fabric.Text(name, {
    fontSize: 16,
    originX: 'center',
    originY: 'center',
    //fill: color,
    fontWeight: 'bold',
    fontFamily: 'arial'
  })

  var token = new fabric.Group([circle, text], {
    left: coordinates.x,
    top: coordinates.y,
    selectable: true
  });


  canvas.add(token);
}

function randomCoordinates(xLimit, yLimit){
  var x = Math.floor(Math.random()*xLimit);
  var y = Math.floor(Math.random()*yLimit);
  return {x: x, y: y};
}

$(document).on('keydown', function(event){
  
  // if user holds down shift key, they can select / move objects around on the canvas
  if(event.which === 16){
    if(!canvas.isDrawingMode){
      return;
    } else {
      canvas.isDrawingMode = false;
    }
  }
  
  //let users delete objects that they have currently selected with backspace or del key
  if(event.which === 8 || event.which === 46){
    var activeObject = canvas.getActiveObject();
    canvas.remove(activeObject);
  }
});

$(document).on('keyup', function(event){
  if(event.which === 16){
    canvas.isDrawingMode = true;
  }
})

app.init();