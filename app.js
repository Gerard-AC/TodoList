//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("item", itemsSchema);

const defaultItem1 = new Item({
  name: "Welcome to your todo list"
});

const defaultItem2 = new Item({
  name: "Hit + to add items "
});

const defaultItem3 = new Item({
  name: "<= Hit this to delete items"
});

const defaultItems = [defaultItem1, defaultItem2, defaultItem3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, result){
    if(result.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err)
          console.log(err);
        else
          console.log("Default insert success");
      });
      res.redirect("/");
    }
    else
      res.render("list", {listTitle: "Today", newListItems: result});
  });

});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req,res){
  //console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);
  //findOne returns object, find returns array of objects
  //findOne cannot use length
  List.findOne({name: customListName}, function(err, result){
    if(!err){
      if(result){
        res.render("list", {listTitle: result.name, newListItems: result.items});
      }
      else{
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
    }
    else
      console.log(err);
  });
});

app.post("/", function(req, res){

  const listName = req.body.list;
  const itemName = req.body.newItem;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, result){
      result.items.push(item);
      result.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err)
        console.log(err);
      else
        console.log("Deleted checked item");
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id : checkedItemId}}}, function(err, result){
      if(err)
        console.log(err);
      else
        res.redirect("/" + listName);
    });
  }

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
