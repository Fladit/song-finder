const Axios = require('axios')
const moment = require('moment')
const {mainErrors, createCustomError} = require('../server/customErrors/mainErrors')
require('dotenv').config()

const getVideoID = (videoURL) => {
    if (videoURL)
    {
        if (videoURL.length >= 16)
        {
            if (videoURL.includes("youtube.com"))
            {
                if (videoURL.includes("v="))
                {
                    return videoURL.split("v=")[1].substring(0,11);
                }
                else return false;
            }
            else {
                if (videoURL.includes("youtu.be"))
                {
                    return videoURL.split("youtu.be/")[1].substring(0,11);
                }
                else return false;
            }
        }
        else return false;
    }
    else return false;
}

const getVideoDuration = async (videoID) => {
    const APIkey = process.env.YOUTUBE_API_KEY
    const reqURL = `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&part=contentDetails&key=${APIkey}`
    console.log(reqURL)
    try {
        const response = await Axios.get(reqURL);
        let isoTime = response.data.items[0]?.contentDetails?.duration
        if (!isoTime)
            throw mainErrors.INCORRECT_VIDEO_LINK_ERROR
        const date = (moment.duration(isoTime).asMilliseconds() / 1000);
        return date - 1;
    }
    catch (e) {
        console.log(e)
        if (e.error.name === mainErrors.INCORRECT_VIDEO_LINK_ERROR.error.name) {
            throw e
        }
        const err = mainErrors.YOUTUBE_API_ERROR
        err.error.message = e.error.message
        throw err
    }
}

// start - начало видео, end - конец видео
const checkVideoRequirements = async (videoURL, start, end) => {
    const minDuration = 5
    if (start < 0) {
        throw mainErrors.INCORRECT_VIDEO_PARAMETERS_ERROR.BAD_START_TIME
    }
    else if (end <= start) {
        throw mainErrors.INCORRECT_VIDEO_PARAMETERS_ERROR.BAD_END_TIME
    }
    else if (end - start < minDuration) {
        throw mainErrors.INCORRECT_VIDEO_PARAMETERS_ERROR.BAD_DURATION
    }
    const videoID = getVideoID(videoURL);
    if (videoID) {
        try {
            const duration = await getVideoDuration(videoID);
            console.log("checkout duration: ", duration);
            if (duration >= minDuration)
                return duration >= minDuration
            throw mainErrors.INCORRECT_VIDEO_PARAMETERS_ERROR.BAD_DURATION
        }
        catch (e) {
            throw e
        }
    }
    throw mainErrors.INCORRECT_VIDEO_LINK_ERROR

}



module.exports = {getVideoDuration, getVideoID, checkVideoRequirements};
