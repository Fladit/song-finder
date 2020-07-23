const Puppeteer = require('puppeteer');
const http = require('http')
const fs = require('fs')
const https = require('https')
const Axios = require('axios')
const Cutter = require('mp3-cutter')
const path = require('path')
const FormData = require('form-data')
const moment = require('moment')
require('dotenv').config()
console.log("start")

const checkRequirements = async (videoURL, start, end) => {
    if (start <= 0 || end <= start || (end - start) < 3) {
        return false;
    }

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

    const duration = await getVideoDuration(videoID);
    console.log("checkout duration: ", duration);
    if (duration < 5)
        return false;
    return true;

}
const getVideoDuration = async (videoID) => {
    const APIkey = process.env.YOUTUBE_API_KEY
    const reqURL = `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&part=contentDetails&key=${APIkey}`
    const response = await Axios.get(reqURL);
    let isoTime = response.data.items[0].contentDetails.duration
    const date = (moment.duration(isoTime).asMilliseconds() / 1000);
    return date;
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

const findSong = async (videoURL, start, end) =>{
    const check = await checkRequirements(videoURL, start, end);
    if (!check)
        return "error";
    const currentPath = __dirname + "/../client/me/"
    const linkForDownload = await getLink(videoURL);
    console.log("Link: ", linkForDownload);
    const song = fs.createWriteStream(currentPath + "song.mp3");
    const targetPath = currentPath + 'target.mp3'
    console.log(typeof linkForDownload, " value = ", linkForDownload)
    try {
        const response = await Axios({
            url: linkForDownload,
            method: 'GET',
            responseType: 'stream'
        })

        response.data.pipe(song)
        await waitPipeFile(song, targetPath, start, end);

        const res = await audDRequest(targetPath)
        //const songLinkRes = await Axios.get("https://lis.tn/ZgEEs");
        //console.log(songLinkRes)
        console.log("auddInfo: ", res.data)
        fs.unlink(song.path, err => err);
        fs.unlink(targetPath, err => err);
        return res;
    }
    catch (e) {
        console.log(e)
        song.close()
    }

}


const videoInfo = findSong("https://www.youtube.com/watch?v=QRmQagwX_bo", 10, 15);
//const fileInfo = findSong("https://www.youtube.com/watch?v=QRmQagwX_bo", 10, 20)
//console.log("result: " , fileInfo.data)



