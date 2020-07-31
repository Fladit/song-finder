require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const main = require("./main")
const mainRoute = require("./routes/mainRoute")
const bodyParser = require("body-parser")

const app = express();
app.use(mainRoute);
app.use(bodyParser.json())
app.set('trust proxy', true)

mongoose.connect(process.env.MONGOOSE_URL, {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    if (err)
        throw err;
    app.listen(3001);
})

