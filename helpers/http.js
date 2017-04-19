let https = require('https'),
    http  = require('http');

module.exports = {
    get: function (url) {
        return new Promise((resolve, reject) => {
            (url.includes("https://") ? https : http).get(url, res => {

                let body = '';

                res.on('data', chunk => body += chunk);
                res.on('end', () => { resolve(body); });

            }).on('error', e => {
                reject(e, {
                    message: "Error in http request.",
                    url:     url
                });
            });
        });
    }
}