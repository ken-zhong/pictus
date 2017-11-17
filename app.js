var express                 = require("express"),
    bodyParser              = require("body-parser"),
    mongoose                = require("mongoose"),
    passport                = require("passport"),
    LocalStrategy           = require("passport-local"),
    passportLocalMongoose   = require("passport-local-mongoose"),
    flash                   = require("connect-flash"),
    methodOverride          = require("method-override"),
    User                    = require("./models/user"),
    Whiteboard              = require("./models/whiteboard"),
    whiteboardServer        = require("./whiteboardServer"),
    settings                = require("./settings.json"),
    app                     = express(),
    server                  = require("http").Server(app),
    io                      = require("socket.io")(server);

var indexRoutes             = require("./controllers/index"),
    authRoutes              = require("./controllers/auth"),
    whiteboardRoutes        = require("./controllers/whiteboard");

mongoose.connect("mongodb://localhost/whiteboard-app");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());

//PASSPORT CONFIG
app.use(require("express-session")({
  secret: settings.secret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use(authRoutes);
app.use(whiteboardRoutes);
app.use(indexRoutes);

io.on("connection", function(socket){
  whiteboardServer.loadWhiteboard(io, socket);
});

server.listen(settings.port, function(){
  console.log("listening on " + settings.port);
});
