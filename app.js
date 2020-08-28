const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const date = require(__dirname + "/date.js");

const app = express();
let port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect with mongodb
mongoose.connect("mongodb+srv://admin-mazhar:OB6HEE2EWLjxStYm@cluster0.1liqw.mongodb.net/mydailytasklist", {useNewUrlParser: true, useUnifiedTopology: true});

// Make Item Schema
const itemsSchema = new mongoose.Schema({
    name: {
        type: String
    }
});

// Make model
const Item = mongoose.model("Item", itemsSchema);

// Make new Items
const item1 = new Item({
    name: "Hit the + (Plus) Button to add a new item."
});
const item2 = new Item({
    name: "Check the box to delete the item."
});
const item3 = new Item({
    name: "Make a new list, write the list name end of the url (mydailytasklist.herokuapp.com/listname) and hit enter."
});
const item4 = new Item({
    name: "Visit the (mydailytasklist.herokuapp.com/listname) and add new item."
});

// Insert Item into database
const defaultItems = [item1, item2, item3, item4];

// Makke List Schema
const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

// Add items
app.get("/", function(req, res) {

    const day = date.getDate();

    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            
            // Insert default items
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully inserted new items.");
                }
                res.redirect("/");
            });
            
        } else {
            // Add new item
            res.render("list", {listTitle: "Today", newListItems: foundItems, currentDate: day});
        }
    });
});

// Make custom list
app.get("/:customListName", function (req, res) {
    const customListName= _.capitalize(req.params.customListName);
    const day = date.getDate();

    List.findOne({name: customListName}, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/");
            } else {
                // Show existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items, currentDate: day});
            }
        }
    });
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    // Insert new list item
    const item = new Item({
        name: itemName
    });

    
    if (listName === "Today") {
        item.save();
        res.redirect("/");        
    } else {
        // Add item into custom list
        List.findOne({name: listName}, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

// Delete Item
app.post("/delete", function (req, res) {
    const deleteItemId = req.body.deleteItemId;
    const listName = req.body.listName;

    if (listName === "Today") {
        // Delete root items
        Item.findOneAndDelete(deleteItemId, function (err) {
            if (!err) {
                console.log(`Successfully delete the item id ${deleteItemId}`);
                res.redirect("/");
            }
        });        
    } else {
        // Delete custom list item
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: deleteItemId}}}, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.get("/about", function(req, res){
    res.render("about");
});

app.listen(port, function() {
    console.log(`The server is running on http://localhost:${port}`);
});
