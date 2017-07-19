/* global fabric */
/* global io */
/* global $ */

var canvas = new fabric.Canvas("draw");
var socket = io();
var boardId = window.location.pathname.slice(8);

canvas.set("isDrawingMode", "true");
canvas.freeDrawingBrush.width = 1;

// this implementation of setting global false and turning select true on objects is 
// glitching with our socket loading; each refresh resets the true/false of object selection
//fabric.Object.prototype.selectable = false;

var app = {
    init: function(){
      this.initSockets();
      this.initListeners();
    },
    
    initSockets: function(){
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

      // this listener interferes with our clearPaths function; moved sendCanvas to object removal function
      // canvas.on('object:removed', function(){
      //   sendCanvas();
      // });
    },
      
    initListeners: function(){  
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
            sendCanvas();
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
        
        $('.color-btn').each(function(){
          $(this).on('click', function(){
            var color = $(this).val();
            changeBrushColor(color);
          });
        });
        
        $('#brush-eraser-btn').on('click', function(){
          changeToEraser();
        });
        
        $('#draw-mode-btn').on('click', function(){
          drawMode();
        });

        $('#reset-canvas-btn').on('click', function(){
          resetCanvas();
        });        

        $('#clear-paths-btn').on('click', function(){
          clearPaths();
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

function createToken(name ="A", color="black"){
  if(name.length > 2){
    name = name[0] + name[1];
  } else if(name.length === 0){
    name = 'A';
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
  // **BUG** why doesn't this work properly? Only removes some paths with each call
  canvas._objects.forEach(function(elem){
    if(elem.type === "path"){
      canvas.remove(elem);
    }
  });
  sendCanvas();
}

function createText(newText, size = 16){
  var text = new fabric.Text(newText, {
    fontSize: size,
    left: 150,
    top: 150
  });
  canvas.add(text);
}

app.init();