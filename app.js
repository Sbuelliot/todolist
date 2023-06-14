const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

const Today = new Date();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://sbuelliot:rnluRspTDZJKdphV@cluster0.egxfdym.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
    name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name : "Welcome To Your To-Do-List!",
});

const item2 = new Item({
    name : "Hit the + button to add an item",
});

const item3 = new Item({
    name : "<-- Hit this to delete an item",
});

defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

async function findItems() {
    const foundItems = await Item.find();
    return foundItems;
};

app.get("/", async function(req, res) {
    try {
        const foundItems = await findItems();
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems);
            console.log("You have succesfully saved default items on DB");
            res.redirect("/");
        }
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    } catch (err) {
        console.log(err);
    }
});

app.get("/:customeListName", async function(req, res) {
    const customeListName = _.capitalize(req.params.customeListName);

    const foundList = await List.findOne({name: customeListName});

    if (!foundList){
        const list = new List({
            name: customeListName,
            items: defaultItems
        });
    
        list.save();
        res.redirect("/" + customeListName);
    } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    };

    
});

const mylist = require("./list");

app.post("/", async function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today"){
        await item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
        });
    }

});


app.post("/delete", async function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        if(checkedItemId != undefined){
            await Item.findByIdAndRemove(checkedItemId)
            .then(()=>console.log(`Deleted ${checkedItemId} Successfully`))
            .catch((err) => console.log("Deletion Error: " + err));
            res.redirect("/");
            }
    } else {
        await List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: checkedItemId}}}
            );
            console.log(`Deleted ${checkedItemId} Successfully`);
            res.redirect("/" + listName);
    }

  });

app.get("/about", function(req, res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);

app.listen(port, function () {
    console.log("Server started successfully");
});
