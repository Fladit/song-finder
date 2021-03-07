const Axios = require('axios')
const moment = require('moment')
const {mainErrors, createCustomError} = require('../server/customErrors/mainErrors')
require('dotenv').config()

const getVideoID = (videoURL) => {
    let videoID = ""
    if (videoURL)
    {
        if (videoURL.length >= 16)
        {
            if (videoURL.includes("youtube.com"))
            {
                if (videoURL.includes("v="))
                {
                    videoID = videoURL.split("v=")[1].substring(0,11);
                }
                else return false;
            }
            else {
                if (videoURL.includes("youtu.be"))
                {
                    videoID = videoURL.split("youtu.be/")[1].substring(0,11);
                }
                else return false;
            }
        }
        else return false;
    }
    else return false;
    return videoID;
}

// start - начало видео, end - конец видео
const checkVideoRequirements = async (videoURL, start, end) => {
    const throwVideoError = (message) => {
        const err = createCustomError(message, mainErrors.INCORRECT_VIDEO_PARAMETERS_ERROR.error.code,
            mainErrors.INCORRECT_VIDEO_PARAMETERS_ERROR.error.name)
        throw err
    }
    const minDuration = 5
    if (start < 0) {
        throwVideoError("Start of video must be more than 0")
    }
    else if (end <= start) {
        throwVideoError("End of video must be more than start")
    }
    else if (end - start < minDuration) {
        throwVideoError("Duration of video must be 5 sec or more")
    }
    const videoID = getVideoID(videoURL);
    if (videoID) {
        try {
            const duration = await getVideoDuration(videoID);
            console.log("checkout duration: ", duration);
            if (duration >= minDuration)
                return duration >= minDuration
            throwVideoError("Duration of video must be 5 sec or more")
        }
        catch (e) {
            throw e
        }
    }
    throwVideoError("Invalid link to the video")

}
const getVideoDuration = async (videoID) => {
    const APIkey = process.env.YOUTUBE_API_KEY
    const reqURL = `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&part=contentDetails&key=${APIkey}`
    console.log(reqURL)
    try {
        const response = await Axios.get(reqURL);
        let isoTime = response.data.items[0].contentDetails.duration
        const date = (moment.duration(isoTime).asMilliseconds() / 1000);
        return date - 1;
    }
    catch (e) {
        const err = mainErrors.YOUTUBE_API_ERROR
        err.error.message = e.error.message
        throw err
    }
}



module.exports = {getVideoDuration, getVideoID, checkVideoRequirements};
