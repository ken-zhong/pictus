var express = require("express");
var router = express.Router();
var passport = require('passport');
var User = require("../models/user");
var Whiteboard = require("../models/whiteboard");

router.post("/boards", isLoggedIn, function(req, res){
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

router.get("/boards/:id", function(req, res){
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
router.put("/boards/:id", checkBoardOwnership, function(req, res){
  var newName = {
    name: req.body.newBoardName
  };
  Whiteboard.findByIdAndUpdate(req.params.id, newName, function(err, success){
    req.flash("success", "You have renamed that whiteboard");
    res.redirect("/");
  });
});

//THIS REFS TO OBJECT ID, NOT SHORTID
router.delete("/boards/:id", checkBoardOwnership, function(req, res){
  Whiteboard.findByIdAndRemove(req.params.id, function(err){
    req.flash("success", "You have deleted that whiteboard");
    res.redirect("/");
  });
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

module.exports = router;
