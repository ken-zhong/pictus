var express = require("express");
var router = express.Router();
var passport = require('passport');
var User = require("../models/user");
var Whiteboard = require("../models/whiteboard");

router.get("/login", function(req, res){
  res.render("login");
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res){
});

router.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

router.get("/register", function(req, res){
  res.render("register");
});

router.post("/register", function(req, res){
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

module.exports = router;
