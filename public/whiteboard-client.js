/* global fabric */
/* global io */
/* global $ */

var canvas = new fabric.Canvas("draw");
var socket = io();
var boardId = window.location.pathname.slice(8);

canvas.set("isDrawingMode", "true");
canvas.freeDrawingBrush.width = 1;
//fabric.Object.prototype.selectable = false;

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

        canvas.on('object:removed', function(){
          sendCanvas();
        });
        
        $(document).on('keydown', function(event){
          
          // if user holds down shift key, they can select / move objects around on the canvas
          if(event.which === 16){
            if(canvas.isDrawingMode){
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
        });
        
        $('#tokenCreate').on('click', function(){
          var name = $('#tokenName').val();
          var color = $('#tokenColor').val();
          createToken(name, color);
          $('#tokenName').val('');
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
  refreshCanvas();
}

function refreshCanvas(){
  // this check makes sure that anything drawn is not selectable, 
  // and objects are brought to the top so that you can't erase objects with the eraser
  canvas._objects.forEach(function(element){
    if(element.type === "path"){
      element.selectable = false;
    } else {
      canvas.bringToFront(element);
    }
  });  
}

function resetCanvas(){
  canvas.loadFromJSON('{"objects":[]}');
  sendCanvas();
}

function saveCanvas(){
  return JSON.stringify(canvas);
}

function drawMode(){
  canvas.isDrawingMode = !canvas.isDrawingMode;
  refreshCanvas();
}

function changeBrushColor(color){
  if(!canvas.isDrawingMode){
    canvas.isDrawingMode = true;
  }
  canvas.freeDrawingBrush.color = color;
  canvas.freeDrawingBrush.width = 1;
}

function changeToEraser(){
  if(!canvas.isDrawingMode){ 
    canvas.isDrawingMode = true;
  }
  canvas.freeDrawingBrush.color = 'white';
  canvas.freeDrawingBrush.width = 90;
}

function createToken(name ="#", color="black"){
  if(name.length > 2){
    name = name[0] + name[1];
  }
  
  var coordinates = randomCoordinates(500, 500);
  
  var circle = new fabric.Circle({
    radius: 20,
    fill: 'white',
    originX: 'center',
    originY: 'center',
    strokeWidth: 2,
    stroke: color
  });

  var text = new fabric.Text(name, {
    fontSize: 16,
    originX: 'center',
    originY: 'center',
    fill: color,
    fontWeight: 'bold',
    fontFamily: 'arial'
  });

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

function clearPaths(){
  canvas._objects.forEach(function(elem){
    if(elem.type === "path"){
      canvas.remove(elem);
    }
  });
  sendCanvas();
}

app.init();