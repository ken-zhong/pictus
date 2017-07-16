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
    settings                = require("settings.json"),
    
    app                     = express(),
    server                  = require("http").Server(app),
    io                      = require("socket.io")(server);

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


// ROUTES BELOW
app.get("/", function(req, res){
    if(req.isAuthenticated()){
        return res.render("home");
    }
    res.render("landing");
});

app.get("/home", isLoggedIn, function(req, res){
    res.render("home");
});

app.get("/about", function(req, res){
    res.render("about");
});

app.get("/join", function(req, res){
    res.render("join");
});

app.post("/join", function(req, res){
    res.redirect("/boards/" + req.body.boardId);
});

app.get("/boards/:id", function(req, res){
    Whiteboard.findById(req.params.id, function(err, foundWhiteboard){
        if(err || !foundWhiteboard){
            console.log(err);
            req.flash("error", "Oops, that board could not be found!");
            res.redirect("/join");
        } else {
            // console.log(foundWhiteboard)
            res.render("show", {whiteboard: foundWhiteboard});
        }
    });
});


// AUTEHENTICATION ROUTES
app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res){
});

app.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "You have successfully logged out!");
    res.redirect("/");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username, email: req.body.email});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {"error": err.message});
        } else {
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Welcome to Krabby Korp, " + user.username);
                res.redirect("/home");
            });
        }
    });
});

app.get("/*", function(req, res){
    // req.flash("error", "Oops, that page could not be found!")
    res.redirect("/");
});

io.on("connection", function(socket){
    whiteboardServer.loadWhiteboard(io, socket);
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to view that!");
    res.redirect('/login');
}

server.listen(settings.port, function(){
    console.log("listening on " + process.env.PORT);
});