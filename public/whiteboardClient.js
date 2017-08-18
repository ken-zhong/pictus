/* global fabric */
/* global io */
/* global $ */

const socket = io();
const boardId = window.location.pathname.slice(8);
var canvas = new fabric.Canvas("draw");

var app = {
    init: function(){
      this.initSockets();
      this.initListeners();
      canvas.set("isDrawingMode", "true");
      canvas.freeDrawingBrush.width = 1;
    },

    initSockets: function(){
      socket.on('connect', function(){
        socket.emit('room', boardId);
      });
      socket.on('boardState', function(val){
        app.updateCanvas(val);
      });
      canvas.on('path:created', function(){
        app.sendCanvas();
      });
      canvas.on('object:modified', function(){
        app.sendCanvas();
      });
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
            let activeObject = canvas.getActiveObject();
            canvas.remove(activeObject);
            app.sendCanvas();
          }
        });
        $(document).on('keyup', function(event){
          if(event.which === 16){
            canvas.isDrawingMode = true;
          }
        });
        $('#tokenCreate').on('click', function(){
          let name = $('#tokenName').val();
          let color = $('#tokenColor').val();
          whiteboard.createToken(name, color);
          $('#tokenName').val('');
          app.sendCanvas();
        });
        $('#textCreate').on('click', function(){
          let text = $('#newText').val();
          let size = $('input[name=textSizeRadio]:checked').val();
          whiteboard.createText(text, size);
          $('#newText').val('');
          app.sendCanvas();
        });
        $('.color-btn').each(function(){
          $(this).on('click', function(){
            let color = $(this).val();
            whiteboard.changeBrushColor(color);
          });
        });
        $('#brush-eraser-btn').on('click', function(){
          whiteboard.changeToEraser();
        });
        $('#draw-mode-btn').on('click', function(){
          whiteboard.drawMode();
        });
        $('#reset-canvas-btn').on('click', function(){
          app.resetCanvas();
        });
    },

    sendCanvas: function(){
      let newData = {};
      newData.JSON = app.saveCanvas();
      newData.room = boardId;
      socket.emit('update', newData);
    },

    updateCanvas: function(newCanvas){
      //pass refreshCanvas in so that it runs after the load;
      //was giving me errors where it would refresh before the new canvas loads
      canvas.loadFromJSON(newCanvas, app.refreshCanvas);
    },

    refreshCanvas: function(){
      // this check makes sure that anything drawn is not selectable,
      // and objects are brought to the top so that you can't erase objects with the eraser
      canvas._objects.forEach(function(element){
        if(element.type === "path"){
          element.selectable = false;
        } else {
          canvas.bringToFront(element);
        }
      });
    },

    resetCanvas: function(){
      canvas.loadFromJSON('{"objects":[]}');
      this.sendCanvas();
    },

    saveCanvas: function(){
      return JSON.stringify(canvas);
    }
};

var whiteboard = {
  drawMode: function(){
    canvas.isDrawingMode = !canvas.isDrawingMode;
    app.refreshCanvas();
  },

  changeBrushColor: function(color){
    if(!canvas.isDrawingMode){
      canvas.isDrawingMode = true;
    }
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = 1;
  },

  changeToEraser: function(){
    if(!canvas.isDrawingMode){
      canvas.isDrawingMode = true;
    }
    canvas.freeDrawingBrush.color = 'white';
    canvas.freeDrawingBrush.width = 90;
  },

  createToken: function(name, color="black"){
    if(name.length > 2){
      name = name[0] + name[1];
    } else if(name.length === 0){
      name = 'A';
    }

    let coordinates = this.randomCoordinates(500, 500);

    let circle = new fabric.Circle({
      radius: 20,
      fill: 'white',
      originX: 'center',
      originY: 'center',
      strokeWidth: 2,
      stroke: color
    });

    let text = new fabric.Text(name, {
      fontSize: 16,
      originX: 'center',
      originY: 'center',
      fill: color,
      fontWeight: 'bold',
      fontFamily: 'arial'
    });

    let token = new fabric.Group([circle, text], {
      left: coordinates.x,
      top: coordinates.y,
      selectable: true
    });

    canvas.add(token);
  },

  randomCoordinates: function(xLimit, yLimit){
    let x = Math.floor(Math.random()*xLimit);
    let y = Math.floor(Math.random()*yLimit);
    return {x: x, y: y};
  },

  createText: function(newText, size = 16){
    let text = new fabric.Text(newText, {
      fontSize: size,
      left: 150,
      top: 150
    });
    canvas.add(text);
  },

  createImage: function(url){
    fabric.Image.fromURL(url, function(newImage){
      canvas.add(newImage);
      app.sendCanvas();
    });
    app.refreshCanvas();
  },

  clearPaths: function(){
    canvas._objects.forEach(function(elem){
      if(elem.type === "path"){
        canvas.remove(elem);
      }
    });
    app.sendCanvas();
  }
};

app.init();
