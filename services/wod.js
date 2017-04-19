let http    = require('../helpers/http'),
    utils   = require('../helpers/utils'),
    {check} = require('../helpers/validator'),
    log     = require('../helpers/logger'),
    parse   = require('./parsers/wod');

class WodService {
    constructor(props) {
        this.storage  = {};
        this.settings = {
            "endpointUrl": "https://ninjafitgyms.sites.zenplanner.com/leaderboard-day.cfm?date={date}",
            "expiration": 5
        };

        utils.extend(this.settings, props, true);

        let {log} = console,
            format = msg => `wodService configuration error. ${msg}. Please see readme for configuration instructions.`;

        if (!check(this.settings.endpointUrl).isString().notEmpty().isValid) { throw format(`"config.endpointUrl" must be a valid url`); }
        if (!check(this.settings.expiration) .isInt   ()           .isValid) { throw format(`"config.expiration" must be a valid url`); }
    }

    getEndpointUrl (date) {
        let month = date.getMonth() + 1,
            day   = date.getDate ();

        if (month < 10) month = '0' + month;
        if (day   < 10) day   = '0' + day;

        let param = `${date.getFullYear()}-${month}-${day}`;
        
        return this.settings.endpointUrl.split('{date}').join(param);
    }

    getWodFromStorage (datekey) {
        let wod = this.storage[datekey];

        return !this.isWodExpired(wod) ? wod : null;
    }

    get (datekey) {
        return new Promise(async (resolve, reject) => {
            try {
                let date = this.parseDateKeyParam(datekey);

                datekey = date.getDateKey();

                // attempt to pull wod if it was retrieve recently.
                let wod = this.getWodFromStorage(datekey);

                // checking to make sure the wod exists and that it was pulled
                // recently enough.
                if (wod) { return resolve(wod); }

                // if we don't have a wod stored. we need to grab it from ninjafit's 
                // portal website. format the url of the portal website to retrieve
                // the wod.
                let url  = this.getEndpointUrl(date);
                let body = await http.get(url);

                // attempt to parse the wod from the http response
                wod = parse(body, datekey);

                // storing a copy of the wod locally for a temp amount
                this.save(wod, datekey);

                // returning the workout
                resolve(wod);
            }
            catch (e) { reject (e); }
        });
    }

    parseDateKeyParam (datekey) {
        let date = Date.fromDateKey(datekey);

        // validating that the requests date is within the past year
        // which also checks to make sure the entered datekey was passed
        // in as valid.
        if (date < new Date().addYears(-1)) { 
            log.warn('Invalid datekey: ', datekey, ' using current date instead.');

            date = new Date();
        }

        return date;
    }

    isWodExpired (wod) {
        return !wod || new Date() - wod.retrieved > 60000 * this.settings.expiration;
    }

    save (wod, datekey) {

        // setting retrieved time to keep a local copy of the workout (even if none exists).
        wod.retrieved = new Date();

        // storing a copy of the wod locally for a temp amount 
        // of time.
        this.storage[datekey] = this.wod;
    }
}


const service = new WodService((require('../settings.json') || {}).wod);
Object.freeze(service);

module.exports = { 
    get: service.get.bind(service)
};