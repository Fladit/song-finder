require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const main = require("./main")
const mainRoute = require("./routes/mainRoute")
const bodyParser = require("body-parser")
const cors = require("cors")
const requestSchema = require("./Schemes/RequestSchema");

const app = express();
app.set('trust proxy', true)
app.use(cors({origin: true, credentials: true}));
app.use(bodyParser.json())
app.use(mainRoute);

mongoose.connect(process.env.MONGOOSE_URL, {useNewUrlParser: true, useUnifiedTopology: true}, async (err) => {
    if (err)
        throw err;
    await requestSchema.deleteMany({});
    await app.listen(3001, () => {
        console.log("Server is started")
    });
})

