const router = require("express").Router();
const requestSchema = require("../Schemes/RequestSchema")
const mainFunc = require("../main");
router.post("/",   (req, res) => {
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
            await newReq.save(() => {
                setTimeout(() => {
                    newReq.remove( err, removed => {
                        if (err) {
                            console.log("newReq.remove");
                            throw err;
                        }
                    })
                }, 60000);
            });
            console.log("after save")
            console.log(req.body.id, req.body.start, req.body.end, req.ip);
            const songInfo = await mainFunc.findSong(req.body.id, parseInt(req.body.start), parseInt(req.body.end), req.ip === "::1"? "me" : req.ip);
            console.log("song info:", songInfo);
            res.status(200).send(songInfo);
        }
        catch (e) {
            throw e;
        }
    }
    })
})

router.post("/duration", ( async (req, res) => {
    const videoID = mainFunc.getVideoID(req.body.id);
    if (videoID)
    {
        const duration = await mainFunc.getVideoDuration(videoID);
        console.log(duration)
        if (duration < 5)
            res.status(400).send("The video is too short");
        else res.status(200).send({videoID: videoID, duration: duration});
    }
    else res.status(400).send("Incorrect video link");
}))

module.exports = router;