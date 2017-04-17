let cheerio       = require('cheerio'),
    https         = require('https'),
    http          = require('http'),
    {check, trim} = require('../helpers/validator'),
    log           = require('../helpers/logger'),
    utils         = require('../helpers/utils'),
    parse         = require('./parsers/calendar');

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

    isExpired: function (dayData) {
        return !dayData || new Date() - dayData.retrieved > 60000 * settings.expiration;
    },

    parseDateKeyParam: function (datekey) {
        let date = Date.fromDateKey(datekey);

        // validating that the requests date is within the past year
        // which also checks to make sure the entered datekey was passed
        // in as valid.
        if (date < new Date().addYears(-1)) { 
            date = new Date();
        }

        return date;
    },

    toResults: function (days) {
        return {
            start: settings.starttimekey,
            end:   settings.endtimekey,
            days:  days
        };
    },

    getResults: function (start, end) {
        let temp  = start.clone(),
            month = [],
            datekey, dayData, invalid, results;

        do {
            datekey = temp.toDateKey();
            dayData = storage[datekey];

            if (helper.isExpired(dayData)) {
                invalid = true;
                break;
            }
            else { 
                month.push({
                    date:  dayData.date,
                    items: dayData.items
                });
            }

            temp.addDays(1);

        } while (temp <= end);

        return invalid ? null : helper.toResults(month);
    },

    requestMonth: function (month) {
        return new Promise((resolve, reject) => {

            let url     = helper.getUrl(month);
            let datekey = month.toDateKey();
            let results, now;

            (url.includes("https://") ? https : http).get(url, res => {

                let body = '';

                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        // attempt to parse the wod from the http response
                        results = parse(body, datekey);
                        now     = new Date();

                        // looping through the results to save them.
                        utils.foreach(results, day => {

                            // saving the time we retrieved the day
                            day.retrieved = now;

                            // saving day to storage.
                            storage[day.date] = day;   
                        });

                        resolve();
                    }
                    catch (e) {
                        reject(e, {
                            message: "Error parsing calendar from Zenplanner html response",
                            month:   month,
                            url:     url
                        });
                    }
                });

            }).on('error', e => {
                reject(e, {
                    message: "Error in http request for calendar to Zenplanner",
                    month:   month,
                    url:     url
                });
            });
        });
    }
};

let calendarService = module.exports = {
    initialize: function (config) {
       let {log} = console,
            format = msg => `calendarService configuration error. ${msg}. Please see readme for configuration instructions.`;

        log('initializing calendarService...');

        if (!check(config)             .isObject().notNull ().isValid) { throw format("calendarService was initialized without any configuration"); }
        if (!check(config.url)         .isString().notEmpty().isValid) { throw format(`"config.url" must be a valid url`); }
        if (!check(config.expiration)  .isInt   ()           .isValid) { throw format(`"config.expiration" must be a positive integer`); }
        if (!check(config.starttimekey).isString().notEmpty().isValid) { throw format(`"config.starttimekey" must be a valid timekey in the format hhmm`); }
        if (!check(config.endtimekey)  .isString().notEmpty().isValid) { throw format(`"config.endtimekey" must be a valid timekey in the format hhmm`); }

        settings = config;

        log(`calendarService initialized using the following configuration: ${JSON.stringify(settings)}`);
    },

    getRange: function (start, end) {
        return new Promise(async function (resolve, reject) {
            let results = helper.getResults(start, end);
            
            if (!results) {
                await helper.requestMonth(start);

                if (start.getMonth() != end.getMonth()) { await helper.requestMonth(end); }

                results = helper.getResults(start, end)
            }

            resolve(results);
        });
    },

    getMonth: function (datekey) {
        let date  = helper.parseDateKeyParam(datekey),
            start = date.clone().toStartOfMonth(),
            end   = date.clone().toEndOfMonth();

        return this.getRange(start, end);
    },

    getWeek: function (datekey) {
        let date  = helper.parseDateKeyParam(datekey),
            start = date.clone().toStartOfWeek(),
            end   = date.clone().toEndOfWeek();

        return this.getRange(start, end);
    },

    getDay: function (datekey) {
        let date = helper.parseDateKeyParam(datekey);

        return this.getRange(date, date);
    }
};

(config => { calendarService.initialize(config); })(require('../settings.json').calendar);




