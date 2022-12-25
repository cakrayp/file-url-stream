const express = require("express");
const router = express.Router();
const { default: Axios } = require("axios");
const fetch = require("node-fetch");
// const fs = require("fs");
// const ToMs = require("ms");
const { fromBuffer } = require("file-type");
const UserAgent = require("user-agents");
const { tokenToStringfromChartCode, createStream } = require("../lib/myfunction")
const URLParsePath = require("../lib/urlParsePath")
const scrapeninja = require("../lib/scraperNinja");


router.get("/instagram/stream/:PATH_TOKEN", async(req, res, next) => {
    const $TOKEN = req.params.PATH_TOKEN;
    
    if ($TOKEN.length > 2000) return next();
    if ($TOKEN.length < 500) return next();

    if (!$TOKEN.match(/[a-zA-Z0-9]/g)) return res.sendStatus(403);

    const $token_decode = Buffer.from($TOKEN, "base64").toString();
    const $token_toString = Buffer.from($token_decode, "base64").toString();
    const $token_split = $token_toString.split(/::/);
    const $tokenfromChartCode = parseInt(tokenToStringfromChartCode($token_split[1].replace(/\(\)/g,"")));

    if (isNaN($tokenfromChartCode) || $token_split[2] !== "instagram") {
        return res.status(403).setHeader("Content-Type","text/plain").send("Invalid token.");
    }
    
    const isExpired = (Date.now() >= $tokenfromChartCode);

    if (isExpired) {
        return res.status(403).setHeader("Content-Type","text/plain").send("URL stream token is expired to open.");   
    }

    const $user_agent_random = new UserAgent(/Safari/)
    const $user_agent = $user_agent_random.data.userAgent;
    const $file_url = URLParsePath($token_split[0]);
    fetch(`https://scontent.cdninstagram.com${$file_url.pathname}?${$file_url.search}`, {
        method: "GET",
        headers: {
            "Accept": "*/*",
            "User-Agent": $user_agent
        }
    })
    .then(async(response) => {
        const $headers = await response.headers;
        const $binary = await response.buffer();
        res.setHeader("Content-Type", $headers.get("content-type"))
        createStream($binary).pipe(res)
    })
    .catch(async(err) => {
        // res.redirect($file_url)
        console.log(err)
        res.status(500).setHeader("Content-Type","text/plain").send("Error encurred! that file may be corrupted.");
    })
})


router.get("/iganony/stream", async(req, res) => {
    const $token_url = req.query.token;    // decodeURIComponent(decodeURI(req.query.url))
    const $URL = Buffer.from($token_url, "base64").toString()
    const $isProtocolURL = $URL.match(/^http(?:s|)/g);
    const $isOnly_iganony = /^http(?:s|):\/\/cdn-ny[0-9].iganony.com/.test($URL);

    if(!$token_url) return res.sendStatus(403);
    if(!/[a-zA-Z0-9]/g.test($token_url)) return res.status(403).setHeader("Content-Type","text/plain").send("Invalid token");
    if(!$isProtocolURL) return res.setHeader("Content-Type","text/plain").send("Invalid token");
    if(!$isOnly_iganony) return res.setHeader("Content-Type","text/plain").send("Invalid token");

    const $UserAgents = new UserAgent(/Safari/);
    const $User_Agent = $UserAgents.data.userAgent;
    
    scrapeninja({
        method: "GET",
        url: $URL,
        headers: {
            "Accept": "*/*",
            "User-Agent": $User_Agent,
        }
    }).then(async({ data: $response_base64 }) => {
        const $toBuffer = Buffer.from($response_base64, "base64");
        const { mime } = await fromBuffer($toBuffer);
        res.setHeader("Content-Type", mime);
        createStream($toBuffer).pipe(res);
    }).catch(async(err) => {
        // res.redirect($URL)
        res.sendStatus(500)
    })
})


module.exports = router;