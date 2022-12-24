var __dirname = process.cwd();
const express = require("express");
const app = express();
const $PORT = process.env.PORT || 12500;
const cookieParser = require("cookie-parser");
const secure = require("ssl-express-www");
const cors = require("cors");

// Module express
app.use(cookieParser());
app.enable('trust proxy');
app.use(secure);
app.use(cors());


// Router
app.get("/", async(req, res) => {
    res.sendStatus(200);
})

// Router
app.use("/files", require("./router/files"))

// Not found
app.use(async(req, res) => {
    res.sendStatus(404);
})

// App listening to start
app.listen($PORT, () => {
    console.log("App listening to PORT :", $PORT)
})