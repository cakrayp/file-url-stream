// module packages
const express = require("express");
const router = express.Router();
const { default: Axios } = require("axios");
const fetch = require("node-fetch");
// const fs = require("fs");
// const ToMs = require("ms");
const { fromBuffer } = require("file-type");
const UserAgent = require("user-agents");
const moment = require("moment-timezone");

// library packages
const { tokenToStringfromChartCode, createStream } = require("../lib/myfunction")
const Cryptr = require("../lib/cryptr");
const URLParsePath = require("../lib/urlParsePath");
const scrapeninja = require("../lib/scraperNinja");


router.get("/instagram/stream", async(req, res, next) => {
    const $TOKEN = req.query.token;
    
    if ($TOKEN.length > 2000) return next();
    if ($TOKEN.length < 500) return next();

    // if (!$TOKEN.match(/[a-zA-Z0-9]/g)) return res.sendStatus(403);

    const $cryptr = new Cryptr("myTotallySecretKey", { saltLength: 5 });
    const $token_toString = Buffer.from(decodeURIComponent($TOKEN), "base64").toString();  //$cryptr.decrypt($TOKEN);

    // if (!$token_toString) return res.status(403).setHeader("Content-Type","text/plain").send("Invalid token.");

    const $token_split = $token_toString.split(/::/);
    const $token_decrypt = $cryptr.decrypt($token_split[1]);
    const $tokenFromNumberExpired = parseInt($token_decrypt);
    // const $Date_Format = new Date($tokenFromNumberExpired);

    if (isNaN($tokenFromNumberExpired)) {
        return res.status(403).setHeader("Content-Type","text/plain").send("Invalid token.");
    }
    
    const isExpired = (Date.now() >= $tokenFromNumberExpired);

    if (isExpired) {
        const expired_note = `
---------------> TOKEN SIGNATURE <---------------\n
token sigature of URL stream: "${$TOKEN}"\n
----------------> MESSAGES INFO <----------------\n
Message: "This token is expired to open."
Time Expired: "${moment($tokenFromNumberExpired).format('MMMM Do YYYY (dddd)')}"\n\n
`.trim();

        return res.status(403).setHeader("Content-Type","text/plain").send(expired_note);   
    }

    const $user_agent_random = new UserAgent(/Safari/)
    const $user_agent = $user_agent_random.data.userAgent;
    const $URLParsePath = URLParsePath($token_split[0]); console.log($URLParsePath);
    const $BASE_MEDIA_URL = $URLParsePath.href;  // `https://scontent.cdninstagram.com${$URLParsePath.pathname}?${$URLParsePath.search}`;
    const $pathname_split = $URLParsePath.pathname.split(/\//);
    const $checkFileFormats = $pathname_split.slice(-1)[0].split(".").slice(-1)[0] === undefined;
    
    fetch($BASE_MEDIA_URL, {
        method: "GET",
        headers: {
            "Accept": "*/*",
            "User-Agent": $user_agent
        }
    })
    .then(async(response) => {
        const $headers = await response.headers;
        const $binary = await response.buffer();
        const $last_pathname = $pathname_split[$pathname_split.length -1];  // $pathname_split.slice(-1).toString();
        const $filenameFromURL = $checkFileFormats ? `${$last_pathname}.${$headers.get("content-type")}` : $last_pathname;

        res.setHeader('Content-length', $headers.get("content-length"));
        res.setHeader('Content-disposition', `filename=${$filenameFromURL}`);
        res.setHeader('Content-Type', $headers.get("content-type"));
        createStream($binary).pipe(res);
    })
    .catch(async(err) => {
        // res.redirect($URLParsePath.href)
        console.log(err);
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


module.exports = router;