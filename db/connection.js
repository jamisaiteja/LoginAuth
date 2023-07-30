const mongoose = require("mongoose");

const DB ="mongodb+srv://jamisai:saiteja@cluster0.xkog9wn.mongodb.net/AuthUsers?retryWrites=true&w=majority";

mongoose.connect(DB,{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>console.log("Database Connected")).catch((error)=>{
    console.log(error);
})