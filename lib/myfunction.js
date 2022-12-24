"use strict";
const stream = require("stream");

// To My Function
// =============================================

exports.randomArr = function(arr = []) {
    return arr[Math.floor(Math.random() * arr.length)];
}

exports.createStream = (binary) => {
    return new stream.Readable({
        read() {
            this.push(binary);
            this.push(null);
        }
    });
}

exports.tokenToStringfromChartCode = function(token = "") {
    const $token_toString = Buffer.from(token, "base64").toString();
    const $chart_split = $token_toString.split(",");
    
    let $writeChartCode = "";
    for (let i = 0; i < $chart_split.length; i++) {
        $chart_split[i] !== undefined ? $writeChartCode += String.fromCharCode($chart_split[i]) : null
    }

    return $writeChartCode;
}