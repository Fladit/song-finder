const mongoose = require("mongoose")

const requestSchema = new mongoose.Schema ({
    ip: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("Request", requestSchema);
