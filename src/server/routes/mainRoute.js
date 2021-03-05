const router = require("express").Router();
const requestSchema = require("../Schemes/RequestSchema")
const {findSong} = require("../songLogic");
const {getVideoDuration, getVideoID} = require("../videoLogic");
const {createCustomError, mainErrors} = require("../customErrors/mainErrors");
router.post("/",   (req, res) => {
    const userIP = req.ip;
    requestSchema.countDocuments({ip: userIP}, async (err, count) => {
        if (err)
            throw err;
        if (count >= 3)
            res.status(200).send(mainErrors.REQUEST_LIMIT_ERROR)
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
            try {
                const songInfo = await findSong(req.body.id, parseInt(req.body.start), parseInt(req.body.end), req.ip === "::1"? "me" : req.ip);
                console.log("song info:", songInfo);
                res.status(200).send(songInfo);
            }
            catch (e) {
                console.log(e)
                res.status(200).json(e)
            }
        }
        catch (e) {
            throw createCustomError(e.message);
        }
    }
    })
})

router.post("/duration", ( async (req, res) => {
    const videoID = getVideoID(req.body.id);
    if (videoID)
    {
        try {
            const duration = await getVideoDuration(videoID);
            console.log(duration)
            if (duration < 5)
                res.status(200).send(mainErrors.SHORT_VIDEO_ERROR);
            else res.status(200).send({videoID: videoID, duration: duration});
        }
        catch (e) {
            console.log(e)
            res.status(200).json(e)
        }
    }
    else res.status(200).send(mainErrors.INCORRECT_VIDEO_LINK_ERROR);
}))

module.exports = router;
