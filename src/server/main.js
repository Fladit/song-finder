const Puppeteer = require('puppeteer');
const fs = require('fs')
const Axios = require('axios')
const Cutter = require('mp3-cutter')
const FormData = require('form-data')
const moment = require('moment')
const {createCustomError, mainErrors} = require('../server/customErrors/mainErrors')
require('dotenv').config()

const getVideoID = (videoURL) => {
    let videoID = ""
    if (!(videoURL === "" || videoURL === undefined || videoURL === null))
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
const checkRequirements = async (videoURL, start, end) => {
    const throwVideoError = (message) => {
        const err = mainErrors.INCORRECT_VIDEO_PARAMETERS_ERROR
        err.error.message = message
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
const getLink = async (videoURL) => {
    try {
        const browser = await Puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://ytmp3.cc/en13/');
        //await page.$eval("#input", (el, videoURL) => el.value = videoURL);
        await page.evaluate((videoURL) => {
            document.querySelector("#input").value = videoURL
        }, videoURL)
        await page.click("#submit");
        await page.waitForSelector("#buttons > a:nth-child(1)", {visible: true})
        const downloadLink = await page.evaluate(() => {
            const downloadButton = document.querySelector("#buttons > a:nth-child(1)")
            return downloadButton.href
        })
        await browser.close();
        return downloadLink
    }
    catch (e) {
        throw createCustomError(e.message)
    }
}

const audDRequest = async (target) => {
    const targetFile = fs.createReadStream(target)
    let fd = new FormData()
    fd.append("file", targetFile);
    fd.append("api_token", process.env.AUDD_API_KEY)
    console.log(fs.statSync(target)["size"])
    console.log("start AudD Request");

    try {
        return await Axios.post("https://api.audd.io/", fd, {headers: fd.getHeaders()});
    }
    catch (e) {
        throw e
    }
};

const waitPipeFile = (song, targetPath, start, end) => {
    return new Promise((resolve, reject) => {
        console.log("start waiting :)")
        song.on('finish', () => {
            console.log("Download is completed")
            Cutter.cut({
                src: song.path,
                target: targetPath,
                start: start,
                end: end
            })
            console.log("Cut is completed")
            resolve("done");
        })
        song.on('error', () => {
            song.close()
            reject("error")
        })
    })
}

const findSong = async (videoURL, start, end, clientIP) =>{
    await checkRequirements(videoURL, start, end);
    const currentPath = __dirname + `/../client/${clientIP}/`;
    fs.mkdir(currentPath, {recursive: true}, (err) => {
        if (err)
            throw createCustomError(err.message);
    });
    const linkForDownload = await getLink(videoURL);
    console.log("Link: ", linkForDownload);
    const song = fs.createWriteStream(currentPath + "song.mp3");
    const targetPath = currentPath + 'target.mp3'
    //console.log(typeof linkForDownload, " value = ", linkForDownload)
    try {
        const response = await Axios({
            url: linkForDownload,
            method: 'GET',
            responseType: 'stream'
        })
        response.data.pipe(song)
    }
    catch (e) {
        song.close()
        throw createCustomError(e.message)
    }
    await waitPipeFile(song, targetPath, start, end);
    try {
        const res = await audDRequest(targetPath)
        //const songLinkRes = await Axios.get("https://lis.tn/ZgEEs");
        //console.log(songLinkRes)
        console.log("auddInfo: ", res.data)
        fs.unlink(song.path, err => err);
        fs.unlink(targetPath, err => err);
        fs.unlink(currentPath, err => err);
        if (res.data.status === "error") {
            throw createCustomError(res.data.error.error_message, res.data.error.error_code, "RecognitionFailed")
        }
        song.close()
        return res.data;
    }
    catch (e) {
        song.close()
        throw e
    }

}

module.exports = {getVideoDuration, findSong, getVideoID};
