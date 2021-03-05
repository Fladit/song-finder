const Puppeteer = require('puppeteer');
const fs = require('fs')
const Axios = require('axios')
const Cutter = require('mp3-cutter')
const FormData = require('form-data')
const {createCustomError} = require("./customErrors/mainErrors")
const {checkVideoRequirements} = require("./videoLogic")

const getLinkOfAudioRoad = async (videoURL) => {
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

const sendAuddRequest = async (target) => {
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

const waitResultOfPipeFile = (song, targetPath, start, end) => {
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
    await checkVideoRequirements(videoURL, start, end);
    const currentPath = __dirname + `/../client/${clientIP}/`;
    fs.mkdir(currentPath, {recursive: true}, (err) => {
        if (err)
            throw createCustomError(err.message);
    });
    const linkForDownload = await getLinkOfAudioRoad(videoURL);
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
    await waitResultOfPipeFile(song, targetPath, start, end);
    try {
        const res = await sendAuddRequest(targetPath)
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

module.exports = {findSong}
