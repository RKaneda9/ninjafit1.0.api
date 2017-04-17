let https         = require('https'),
    http          = require('http'),
    parse         = require('./parsers/wod'),
    {check, trim} = require('../helpers/validator'),
    log           = require('../helpers/logger');

let storage  = {},
    settings = {};

let helper = {

    getUrl: function (date) {
        let month = date.getMonth() + 1,
            day   = date.getDate ();

        if (month < 10) month = '0' + month;
        if (day   < 10) day   = '0' + day;

        let _param = `${date.getFullYear()}-${month}-${day}`;
        
        return settings.url.split('{date}').join(_param);
    },

    isExpired: function (wod) {
        return !wod || new Date() - wod.retrieved > 60000 * settings.expiration;
    }
};

let wodService = module.exports = {
    initialize: function (config) {
        let {log} = console,
            format = msg => `wodService configuration error. ${msg}. Please see readme for configuration instructions.`;

        log('initializing wodService...');

        if (!check(config)           .isObject().notNull ().isValid) { throw format("wodService was initialized without any configuration"); }
        if (!check(config.url)       .isString().notEmpty().isValid) { throw format(`"config.url" must be a valid url`); }
        if (!check(config.expiration).isInt   ()           .isValid) { throw format(`"config.expiration" must be a valid url`); }

        settings = config;

        log(`wodService initialized using the following configuration: ${JSON.stringify(settings)}`);
    },

    get: function (datekey) {
        return new Promise((resolve, reject) => {

            let date = Date.fromDateKey(datekey);

            // validating that the requests date is within the past year
            // which also checks to make sure the entered datekey was passed
            // in as valid.
            if (date < new Date().addYears(-1)) { 
                log.warn('Invalid datekey: ', datekey, ' using current date instead.');

                date    = new Date();
                datekey = date.toDateKey();
            }

            // attempt to pull wod if it was retrieve recently.
            let wod = storage[datekey];

            // checking to make sure the wod exists and that it was pulled
            // recently enough.
            if (!helper.isExpired(wod)) { return resolve(wod); }

            // if we don't have a wod stored. we need to grab it from ninjafit's 
            // portal website. format the url of the portal website to retrieve
            // the wod.
            let url = helper.getUrl(date);

            (url.includes("https://") ? https : http).get(url, res => {

                let body = '';

                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        // attempt to parse the wod from the http response
                        wod = parse(body, datekey);

                        // setting retrieved time to keep a local copy of the workout (even if none exists).
                        wod.retrieved = new Date();

                        // storing a copy of the wod locally for a temp amount 
                        // of time.
                        storage[datekey] = wod;

                        // returning the wod.
                        resolve(wod);
                    }
                    catch (e) {

                        log.error(`Error parsing wod from html response for datekey=${datekey}`, e, body);
                        reject(e, {
                            message: "Error parsing wod from Zenplanner html response",
                            datekey: datekey,
                            url:     url
                        });
                    }
                });

            }).on('error', e => {
                
                log.error(`Error in http request for wod for datekey=${datekey}`, e);
                reject(e, {
                    message: "Error in http request for wod to Zenplanner",
                    datekey: datekey,
                    url:     url
                });
            });
        });
    }
};

(config => { wodService.initialize(config); })(require('../settings.json').wod);