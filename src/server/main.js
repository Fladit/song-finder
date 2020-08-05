const Puppeteer = require('puppeteer');
const fs = require('fs')
const Axios = require('axios')
const Cutter = require('mp3-cutter')
const path = require('path')
const FormData = require('form-data')
const moment = require('moment')
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

const checkRequirements = async (videoURL, start, end) => {
    if (start <= 0 || end <= start || (end - start) < 3) {
        console.log("Wrong time period");
        return false;
    }

    const videoID = getVideoID(videoURL);
    if (videoID) {
        const duration = await getVideoDuration(videoID);
        console.log("checkout duration: ", duration);
        if (duration < 5)
            return false;
        return true;
    }
    console.log("Wrong id");
    return false;

}
const getVideoDuration = async (videoID) => {
    const APIkey = process.env.YOUTUBE_API_KEY
    const reqURL = `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&part=contentDetails&key=${APIkey}`
    const response = await Axios.get(reqURL);
    let isoTime = response.data.items[0].contentDetails.duration
    const date = (moment.duration(isoTime).asMilliseconds() / 1000);
    return date - 1;
}
const getLink = async (videoURL) => {
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://ytmp3.cc/en13/');
    //await page.$eval("#input", (el, videoURL) => el.value = videoURL);
    await page.evaluate( (videoURL) => {
        document.querySelector("#input").value = videoURL
    }, videoURL)
    await page.click("#submit");
    await page.waitForSelector("#buttons > a:nth-child(1)", {visible: true})
    const downloadLink = await page.evaluate( () => {
        const downloadButton = document.querySelector("#buttons > a:nth-child(1)")
        return downloadButton.href
    })
    await browser.close();
    return downloadLink
}

const audDRequest = async (target) => {
    const targetFile = fs.createReadStream(target)
    let fd = new FormData()
    fd.append("file", targetFile);
    fd.append("api_token", process.env.AUDD_API_KEY)
    console.log(fs.statSync(target)["size"])
    console.log("start AudD Request");

    try {
        const response = await Axios.post("https://api.audd.io/", fd, {headers: fd.getHeaders()})
        return response;
    }
    catch (e) {
        alert(e)
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
    const check = await checkRequirements(videoURL, start, end);
    if (!check)
        return "requirements are violated";
    const currentPath = __dirname + `/../client/${clientIP}/`;
    fs.mkdir(currentPath, {recursive: true}, (err) => {
        if (err)
            throw err;
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
        console.log("log 1")
        await waitPipeFile(song, targetPath, start, end);

        const res = await audDRequest(targetPath)
        //const songLinkRes = await Axios.get("https://lis.tn/ZgEEs");
        //console.log(songLinkRes)
        console.log("auddInfo: ", res.data)
        fs.unlink(song.path, err => err);
        fs.unlink(targetPath, err => err);
        fs.unlink(currentPath, err => err);
        return res.data;
    }
    catch (e) {
        console.log(e)
        song.close()
    }

}

module.exports = {getVideoDuration, findSong, getVideoID};