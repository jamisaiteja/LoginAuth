require("dotenv").config();
const express = require("express");
const app = express();
//database connection

require("./db/connection");
const router = require("./routes/router");
const cors = require("cors");
const cookieParser = require("cookie-parser");

//console.log(process.env.SECRET);
const port = process.env.PORT || 8009;

// app.get("/", (req, res) => {
//     res.status(201).json("server created");
// })

//connection b/w frontend and backend
app.use(express.json()); //frontend data is passed in json format to backend
app.use(cookieParser());
//app.use(cors()); //  Integration between frontend and backend (because frontend(3000) and backend(8009) runs in diff ports)
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(router);

app.listen(port,()=>{
    console.log(`Server Started at port no ${port}`);
});

