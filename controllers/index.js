var express = require("express");
var router = express.Router();
var passport = require('passport');
var User = require("../models/user");
var Whiteboard = require("../models/whiteboard");

router.get("/", function(req, res){
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

router.get("/about", function(req, res){
  res.render("about");
});

router.get("/join", function(req, res){
  res.render("join");
});

router.post("/join", function(req, res){
  res.redirect("/boards/" + req.body.boardId);
});

router.get("/*", function(req, res){
  res.redirect("/");
});

module.exports = router;
