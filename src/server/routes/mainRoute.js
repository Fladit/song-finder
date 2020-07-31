const router = require("express").Router();
const requestSchema = require("../Schemes/RequestSchema")
router.get("/",   (req, res) => {
    const userIP = req.ip;
    requestSchema.countDocuments({ip: userIP}, async (err, count) => {
        if (err)
            throw err;
        if (count >= 3)
            res.status(423).send({message: "Request limit exceeded!"})
        else {
        const newReq = new requestSchema({
            ip: req.ip
        });
        try {
            await newReq.save();
            res.status(200).send(newReq);
            console.log(newReq)
        }
        catch (e) {
            throw e;
        }
    }
    })
})

module.exports = router;