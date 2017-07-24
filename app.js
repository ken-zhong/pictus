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

mongoose.connect(settings.MongoURL);

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
    User.findById(req.user.id).populate("boards").exec(function(err, foundUser){
      if(err){
          res.send(err);
      } else {
          res.render("home", {user: foundUser});
      }
    });
  } else {
    res.render("landing");
  }
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

// ==========================================================
// whiteboard CREATE, SHOW, UPDATE, and DESTROY routes below:
app.post("/boards", isLoggedIn, function(req, res){
  User.findById(req.user._id, function(err, foundUser){
    if(err){
      req.flash("error", err);
      res.redirect("/");
    } else {
      Whiteboard.create({}, function(err, newBoard){
        if(err){
          req.flash("error", err);
          res.redirect("/");
        } else {
          newBoard.author.id = req.user._id;
          newBoard.author.username = req.user.username;
          if(req.body.newBoardName.length === 0){
            newBoard.name = "new board";
          } else {
            newBoard.name = req.body.newBoardName;
          }
          newBoard.save();

          foundUser.boards.unshift(newBoard);
          foundUser.save();
          res.redirect("/boards/" + newBoard.shortId);
        }
      });
    }
  });
});

app.get("/boards/:id", function(req, res){
  Whiteboard.findOne({"shortId": req.params.id}, function(err, foundWhiteboard){
    if(!foundWhiteboard || err){
      // console.log(err);
      req.flash("error", "Oops, that board could not be found!");
      res.redirect("/join");
    } else {
      res.render("show", {whiteboard: foundWhiteboard});
    }
  });
});

//THIS REFS TO OBJECT ID, NOT SHORTID
app.put("/boards/:id", checkBoardOwnership, function(req, res){
  var newName = {
    name: req.body.newBoardName
  };
  Whiteboard.findByIdAndUpdate(req.params.id, newName, function(err, success){
    req.flash("success", "You have renamed that whiteboard");
    res.redirect("/");
  });
});

//THIS REFS TO OBJECT ID, NOT SHORTID
app.delete("/boards/:id", checkBoardOwnership, function(req, res){
  Whiteboard.findByIdAndRemove(req.params.id, function(err){
    req.flash("success", "You have deleted that whiteboard");
    res.redirect("/");
  });
});

// AUTEHENTICATION ROUTES ===========================+==========
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

function checkBoardOwnership(req, res, next){
  if(req.isAuthenticated()){
    Whiteboard.findById(req.params.id, function(err, foundWhiteboard){
      if(err){
        req.flash("error", err);
        res.redirect("back");
      } else {
        if(foundWhiteboard.author.id.equals(req.user._id)){
          next();
        } else {
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash('error', 'You need to be logged in to do that!');
    res.redirect("back");
  }
}

server.listen(settings.port, function(){
  console.log("listening on " + settings.port);
});
