const express = require("express");
const router = express.Router();
const { default: Axios } = require("axios");
// const fs = require("fs");
// const ToMs = require("ms");
const { fromBuffer } = require("file-type");
const UserAgent = require("user-agents");
const { tokenToStringfromChartCode, createStream } = require("../lib/myfunction")
const scrapeninja = require("../lib/scraperNinja");


router.get("/instagram/stream", async(req, res) => {
    const $file_url = req.query.url;
    const $token_url = req.query.token; //
    
    if (!$file_url) return res.sendStatus(403);
    if (!$token_url) return res.sendStatus(406);

    const $tokenfromChartCode = tokenToStringfromChartCode($token_url);
    const $token_toString = Buffer.from($tokenfromChartCode, "base64").toString();
    const $token_split = $token_toString.split("::");

    if (isNaN($token_split[0]) || $token_split[1] !== "instagram") {
        return res.status(403).setHeader("Content-Type","text/plain").send("Invalid token.");
    }
    
    const isExpired = Date.now() >= $token_split[0];

    if (isExpired) {
        return res.status(403).setHeader("Content-Type","text/plain").send("URL stream token is expired to open.");   
    }

    const $user_agent_random = new UserAgent(/Safari/)
    const $user_agent = $user_agent_random.data.userAgent;
    Axios({
        method: "GET",
        url: $file_url,
        responseType: "stream",
        headers: {
            "Accept": "*/*",
            "User-Agent": $user_agent
        }
    })
    .then(async({ headers, data: $response_stream }) => {
        res.setHeader("Content-Type", headers['content-type']);
        $response_stream.pipe(res);
    })
    .catch(async(err) => {
        // res.redirect($file_url)
        res.sendStatus(500)
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