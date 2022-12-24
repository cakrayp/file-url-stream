const request = require('request');
const useragent = require('random-useragent');
// const fake_Ua = require('./fakeUa');

/**
 * 
 * @param {object} options For a scrape to skip Security from website.
 * @param {object} settings For a settings to set.
 * @returns 
 */

const scrapeninja = async (options = {}, settings = {}) => new Promise(async (resolve, reject) => {
    if (typeof options !== 'object') return reject("it must use an object for scrape")
    if (typeof settings !== 'object') return reject("it must use an object for scrape")

    function ObjectToArray(object) {
        const Arr = [];
        Object.entries(object).forEach((v) => {
            Arr.push(`${v[0]}: ${v[1]}`)
        })
        return Arr
    }

    if (!options.method) return reject("method is required")
    if (!options.url) return reject("URL is require, please enter the URL")
    if (options.headers) options.headers = ObjectToArray(options.headers);

    if (settings.js && typeof settings.js !== "boolean") return reject("it cannot read any input, it must use boolean")
    if (settings.blockImage && typeof settings.blockImage !== "boolean") return reject("it cannot read any input, it must use boolean")
    if (settings.blockMedia && typeof settings.blockMedia !== "boolean") return reject("it cannot read any input, it must use boolean")
    if (settings.steps && typeof settings.steps !== "array") return reject("it cannot read any input, it must use an array")

    if (settings.js === true) {
        opt_settings = { js: true, blockImage: false, blockMedia: false, steps: [] };
        if (settings.blockImage) opt_settings.blockImage = settings.blockImage;
        if (settings.blockMedia) opt_settings.blockMedia = settings.blockMedia;
        if (settings.steps) opt_settings.steps = settings.steps;
        settings = opt_settings;
    }

    request({
        method: "POST",
        url: 'https://scrapeninja.net/scrape-proxy.php',
        headers: {
            "Accept": "*/*",
            "Accept-language": "en-US,en;q=0.9,id;q=0.8",
            "Content-type": "text/plain; charset=UTF-8",
            "User-agent": useragent.getRandom(),
            "Cookie": '_ym_uid=1664460862173369417; _ym_d=1664460862; _ym_isad=2; _ym_visorc=w',
            "Origin": 'https://scrapeninja.net',
            "sec-ch-ua": '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
            "sec-ch-ua-mobile": '?0',
            "sec-ch-ua-platform": "Windows",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": 1,
        },
        body: JSON.stringify({
            "retryNum": 1,
            "geo": "fr",
            ...options,
            ...settings
        })
    }, function (error, response, body) {
        if (body === undefined) return reject(Error("Response is Empty."))
        const data_result = JSON.parse(body)
        if (error) return reject(error)
        else if (data_result.status == 'fail') return reject(data_result.info)
        else if (!data_result.info.statusCode === 200) return reject(data_result.info.statusMessage)
        else resolve({
            statusCode: data_result?.info?.statusCode,
            headers: data_result?.info?.headers,
            pageCookies: data_result?.info?.pageCookies,
            data: data_result?.body
        })
    })
})


module.exports = scrapeninja;