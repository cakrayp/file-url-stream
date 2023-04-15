// module packages
const express = require("express");
const router = express.Router();
const { default: Axios } = require("axios");
const HttpProxyAgent = require("http-proxy-agent");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
// const fs = require("fs");
// const ToMs = require("ms");
const { fromBuffer } = require("file-type");
const request = require("request");
const UserAgent = require("user-agents");
const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");

// library packages
const { tokenToStringfromChartCode, createStream, randomArr } = require("../lib/myfunction")
const Cryptr = require("../lib/cryptr");
const URLParsePath = require("../lib/urlParsePath");
const scrapeninja = require("../lib/scraperNinja");

// Json Web Token
const ACTIVATION_TOKEN = "3yl-qBj!Dgl7Kx5E9=!ZYt9eKf8R6clU&!x529#+@hKL1vYEJnUaaS0HM00eNVtZtW/Bd";
const VerifyToken = function(token) {
    return jwt.verify(token, ACTIVATION_TOKEN, function(error, data) {
        if (error) {
            console.log(error);
            const expired_date = new Date(error.expiredAt);
            const isExpired = Date.now() >= expired_date.valueOf();
            return { isExpired, isValid: !isExpired }
        } else {
            return data;
        }
    })
}


// Route Action Back end
router.get("/download", async(req, res) => {
    const $TOKEN = req.query.token;

    if (!$TOKEN) return res.sendStatus(400);
    
    const jsonwebtoken = VerifyToken(Buffer.from($TOKEN, 'base64').toString());

    if (jsonwebtoken.isValid) return res.setHeader("Content-Type","text/plain").send("Invalid token");
    if (jsonwebtoken.isExpired) return res.setHeader("Content-Type","text/plain").send("signature expired");

    const mediatype_regex = (/^(jp(eg|g)|png|mp(3|4)|webp)$/);
    const $token_toString = JSON.stringify(jsonwebtoken);  // Buffer.from($TOKEN, 'base64').toString();
    const $json_decode = JSON.parse($token_toString);
    const $user_agent_random = new UserAgent(/Safari/);
    const $user_agent = $user_agent_random.data.userAgent;
    const $URLParsePath = URLParsePath($json_decode.url); console.log($URLParsePath);
    const $pathname_split = $URLParsePath.pathname.split(/\//);

    Axios({
        method: "GET",
        url: $URLParsePath.href,
        responseType: 'arraybuffer',
        headers: {
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
            "User-Agent": $user_agent
        }
    })
        .then(async({ data: $response_buffer }) => {
            const { mime, ext } = await fromBuffer($response_buffer);

            if (mediatype_regex.test(ext)) {
                const $filename = $json_decode.filename ? $json_decode.filename : $pathname_split.slice(-1)[0];
                res.setHeader("Content-Type", mime);
                res.setHeader("Content-Disposition", `attachment; filename=${$filename}`);
                createStream($response_buffer).pipe(res);
            } else {
                res.status(301).redirect($URLParsePath.href);
            }

        })
        .catch(async(err) => {
            console.log(err);
            res.status(500).setHeader("Content-Type","text/plain").send("Error encurred! that file may be corrupted.");
        })
})


router.get("/instagram/stream", async(req, res, next) => {
    const $TOKEN = req.query.token;
    
    if (!$TOKEN) return res.sendStatus(400);

    const jsonwebtoken = VerifyToken(Buffer.from($TOKEN, 'base64').toString());

    if (jsonwebtoken.isValid) return res.setHeader("Content-Type","text/plain").send("Invalid token");
    if (jsonwebtoken.isExpired) return res.setHeader("Content-Type","text/plain").send("signature expired");
    
    // if (!$TOKEN.match(/[a-zA-Z0-9]/g)) return res.sendStatus(403);
    const $token_toString = Buffer.from(decodeURIComponent($TOKEN), "base64").toString();
    
    const $user_agent_random = new UserAgent(/Safari/)
    const $user_agent = $user_agent_random.data.userAgent;
    const $URLParsePath = URLParsePath($token_toString); console.log($URLParsePath);
    const $BASE_MEDIA_URL = `https://scontent.cdninstagram.com${$URLParsePath.pathname}?${$URLParsePath.search}`;
    const $pathname_split = $URLParsePath.pathname.split(/\//);
    const $checkFileFormats = $pathname_split.slice(-1)[0].split(".").slice(-1)[0] === undefined;
    
    fetch($BASE_MEDIA_URL, {
        method: "GET",
        headers: {
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
            "User-Agent": $user_agent
        }
    })
    .then(async(response) => {
        const $headers = await response.headers;
        const $binary_buff = await response.buffer();
        const $last_pathname = $pathname_split[$pathname_split.length -1];  // $pathname_split.slice(-1).toString();
        const $filenameFromURL = $checkFileFormats ? `${$last_pathname}.${$headers.get("content-type")}` : $last_pathname;

        res.setHeader('Content-length', $headers.get("content-length"));
        res.setHeader('Content-disposition', `filename=${$filenameFromURL}`);
        res.setHeader('Content-Type', $headers.get("content-type"));
        createStream($binary_buff).pipe(res);
    })
    .catch(async(err) => {
        // res.redirect($URLParsePath.href)
        console.log(err);
        res.status(500).setHeader("Content-Type","text/plain").send("Error encurred! that file may be corrupted.");
    })
})


router.get("/tiktok/stream", async(req, res) => {
    const $TOKEN = req.query.token;

    if (!$TOKEN) return res.sendStatus(400);

    const jsonwebtoken = VerifyToken(Buffer.from($TOKEN, 'base64').toString());
    const tiktok_api_regex = /.(tiktok|tiktokcdn).com/g.test(jsonwebtoken?.url);

    if (jsonwebtoken.isValid) return res.setHeader("Content-Type","text/plain").status(403).send("Invalid token");
    if (jsonwebtoken.isExpired) return res.setHeader("Content-Type","text/plain").status(403).send("signature expired");
    if (!tiktok_api_regex) return res.setHeader("Content-Type","text/plain").status(403).send(`Access denied for "${jsonwebtoken.url}"`)
    
    // if (!$TOKEN.match(/[a-zA-Z0-9]/g)) return res.sendStatus(403);
    const $token_toString = jsonwebtoken.url;
    
    const $user_agent_random = new UserAgent(/Safari/);
    const $user_agent = $user_agent_random.data.userAgent;
    const $URLParsePath = URLParsePath($token_toString); console.log($URLParsePath);

    Axios({
        method: "GET",
        url: $URLParsePath.href,
        responseType: "arraybuffer",
        headers: {
            "Accept": "*/*",
            "Referer": "https://www.tiktok.com/",
            "User-Agent": $user_agent
        }
    })
        .then(async({ data: $binary_buff }) => {
            const { mime } = await fromBuffer($binary_buff);
            
            res.setHeader('Content-Type', mime);
            createStream($binary_buff).pipe(res);
        })
})


router.get("/iganony/stream", async(req, res) => {
    const $token_url = req.query.token;    // decodeURIComponent(decodeURI(req.query.url))

    const $URL = Buffer.from($token_url, "base64").toString()
    const $isProtocolURL = $URL.match(/^http(?:s|)/g);
    const $isOnly_iganony = /^http(?:s|):\/\/cdn-ny[0-9].iganony.com/.test($URL);

    if(!$token_url) return res.sendStatus(403);
    if(!/[a-zA-Z0-9]/g.test($token_url)) return res.status(403).setHeader("Content-Type","text/plain").send("Invalid token");
    if(!$isProtocolURL) return res.status(400).setHeader("Content-Type","text/plain").send("Invalid token");
    if(!$isOnly_iganony) return res.status(400).setHeader("Content-Type","text/plain").send("Invalid token");

    const $UserAgents = new UserAgent(/Safari/);
    const $User_Agent = $UserAgents.data.userAgent;
    
    scrapeninja({
        method: "GET",
        url: $URL,
        headers: {
            "Accept": "*/*",
            "User-Agent": $User_Agent,
        }
    }).then(async({ headers, data: $response_base64 }) => {
        const $toBuffer = Buffer.from($response_base64, "base64");
        const { mime } = await fromBuffer($toBuffer);
        res.setHeader('Content-length', Buffer.byteLength($toBuffer));
        res.setHeader('Content-disposition', `filename=${headers['content-disposition'].match(/filename=(.+)/)[1]}`);
        res.setHeader("Content-Type", mime);
        createStream($toBuffer).pipe(res);
    }).catch(async(err) => {
        // res.redirect($URL)
        console.log(err);
        res.sendStatus(500);
    })
})


router.get("/wallpaper_hd", async(req, res) => {
    const wallURL = req.query.url;
    const isWallpaper_dl = /https:\/\/www.wallpaperflare.com\/(.+)\/download/.test(wallURL);

    if (!wallURL) return res.status(400).setHeader("Content-Type","text/plain").send("Bad request, URL is require for get a wallpaper HD quality")
    if (!isWallpaper_dl) return res.status(400).setHeader("Content-Type","text/plain").send("Bad request, URL is only forget a wallpaper HD quality of https://www.wallpaperflare.com/.../download");

    const user_agent = new UserAgent(/Safari/);
    const headers = {
        "user-agent": user_agent.random().toString(),// "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "cookie": "_ga=GA1.2.863074474.1624987429; _gid=GA1.2.857771494.1624987429; __gads=ID=84d12a6ae82d0a63-2242b0820eca0058:T=1624987427:RT=1624987427:S=ALNI_MaJYaH0-_xRbokdDkQ0B49vSYgYcQ"
    }
    const proxyURL = randomArr([
        "http://5.78.88.155:8080",
        "http://23.88.47.183:8080",
        "http://64.225.107.74:8080",
        "http://102.165.51.172:3128/",
        "http://65.108.230.238:45979",

        "http://167.71.205.47:8080",
        "http://174.138.184.82:41691",
        "http://174.138.184.82:41183",
        "http://128.140.6.139:8080",
        "http://65.108.230.238:40985",

        "http://65.108.230.239:38859",
        "http://167.71.205.47:8080",
        "http://95.217.186.208:8080",
        "http://102.165.51.172:3128",
        "http://5.78.92.65:8080"
        
    ]);
    const httpAgent = new HttpProxyAgent(proxyURL);

    Axios.get(wallURL, { httpAgent, headers })
        .then(async({ data: response_html }) => {
            const $ = cheerio.load(response_html);
            const image_hd_url = $("#show_img").attr("src");
            const { data: file_buffer } = await Axios.get(image_hd_url, { httpAgent, headers, responseType: "arraybuffer" });
            const { mime } = await fromBuffer(file_buffer);
            res.setHeader("Content-Type", mime);
            createStream(file_buffer).pipe(res)
            // res.send(image_hd_url)
        })
        .catch(async(err) => {
            console.log(err)
            res.status(500).setHeader("Content-Type","text/plain").send(`Error enccurred, the server is not working for ${wallURL}`)
        })
})

module.exports = router;