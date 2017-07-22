# Pictus
### v0.5

Pictus is a whiteboarding app that lets you and your collaborators draw and share on a canvas in realtime, as well as store them for later retrieval.

The draw button toggles between free draw mode and item manipulation mode. Alternatively, hold down shift to manipulate items and objects on the canvas.

Delete objects and items by first selecting them and then pressing the 'delete' or 'backspace' key.

Clear the canvas and reset it to a blank slate with the (X) button on the right side of the control dock.

## The Tech Stack
Pictus uses HTML5 Canvas to render the drawing area. A Node.js and Express server connects the different users via websockets to provide real time updates. A MongoDB database saves each canvas state and associates them with users.

Other major libraries used: Socket.io, Fabric.js, Mongoose, Passport.js
