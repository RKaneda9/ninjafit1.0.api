let http    = require('../helpers/http'),
    utils   = require('../helpers/utils'),
    {check} = require('../helpers/validator'),
    log     = require('../helpers/logger'),
    parse   = require('./parsers/calendar');

class CalendarService {
    constructor(props) {
        this.storage  = {};
        this.settings = {
            requestEndpoint:   "https://ninjafitgyms.sites.zenplanner.com/calendar.cfm?date={date}&view=MONTH",
            storageExpiration: 5, // minutes
            startTimeKey:      '0600', // start time for calendar view
            endTimeKey:        '2100'  // end time for calendar view
        };

        utils.extend(this.settings, props, true);

        let {log} = console,
            format = msg => `calendarService configuration error. ${msg}. Please see readme for configuration instructions.`;

        if (!check(this.settings.requestEndpoint)  .isString().notEmpty().isValid) { throw format(`"config.requestEndpoint" must be a valid url`); }
        if (!check(this.settings.storageExpiration).isInt   ()           .isValid) { throw format(`"config.storageExpiration" must be a positive integer`); }
        if (!check(this.settings.startTimeKey)     .isString().notEmpty().isValid) { throw format(`"config.startTimeKey" must be a valid timekey in the format hhmm`); }
        if (!check(this.settings.endTimeKey)       .isString().notEmpty().isValid) { throw format(`"config.endTimeKey" must be a valid timekey in the format hhmm`); }
    }

    getMonth(datekey) {
        let date  = this.parseDateKeyParam(datekey),
            start = date.clone().toStartOfMonth(),
            end   = date.clone().toEndOfMonth();

        return this.getRange(start, end);
    }

    getWeek(datekey) {
        let date  = this.parseDateKeyParam(datekey),
            start = date.clone().toStartOfWeek(),
            end   = date.clone().toEndOfWeek();

        return this.getRange(start, end);
    }

    getDay(datekey) {
        let date = this.parseDateKeyParam(datekey);

        return this.getRange(date, date);
    }

    getRange (start, end) {
        return new Promise(async (resolve, reject) => {
            try {
                let results = this.getRangeFromStorage(start, end);
                
                if (!results) {
                    await this.requestMonth(start);

                    if (start.getMonth() != end.getMonth()) { await this.requestMonth(end); }

                    results = this.getRangeFromStorage(start, end)
                }

                resolve(results);
            }
            catch (e) { reject(e); }
        });
    }

    getEndpointUrl(date) {
        let month = date.getMonth() + 1,
            day   = date.getDate ();

        if (month < 10) month = '0' + month;
        if (day   < 10) day   = '0' + day;

        let param = `${date.getFullYear()}-${month}-${day}`;
        
        return this.settings.requestEndpoint.split('{date}').join(param);
    }

    getRangeFromStorage(start, end) {
        let temp  = start.clone(),
            month = [],
            datekey, dayData, invalid, results;

        do {
            datekey = temp.getDateKey();
            dayData = this.storage[datekey];

            if (this.isDayExpired(dayData)) {
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

        return invalid ? null : this.toResults(month);
    }

    parseDateKeyParam (datekey) {
        let date = Date.fromDateKey(datekey);

        // validating that the requests date is within the past year
        // which also checks to make sure the entered datekey was passed
        // in as valid.
        if (date < new Date().addYears(-1)) { 
            date = new Date();
        }

        return date;
    }

    requestMonth (month) {
        return new Promise(async (resolve, reject) => {

            let url     = this.getEndpointUrl(month);
            let datekey = month.getDateKey();
            let body    = await http.get(url);
            let data    = parse(body, datekey);

            // looping through the results to save them.
            utils.foreach(data, day => {

                // saving the time we retrieved the day
                day.retrieved = new Date();

                // saving day to storage.
                this.storage[day.date] = day;   
            });

            resolve();
        });
    }

    isDayExpired(dayData) { 
        return !dayData 
            || !dayData.retrieved
            || new Date() - dayData.retrieved > 60000 * this.settings.storageExpiration; 
    }

    toResults(days) {
        return {
            start: this.settings.startTimeKey,
            end:   this.settings.endTimeKey,
            days:  days
        };
    }
}

const service = new CalendarService((require('../settings.json') || {}).calendar);
Object.freeze(service);

module.exports = { 
    getMonth: service.getMonth.bind(service), 
    getWeek:  service.getWeek .bind(service),
    getDay:   service.getDay  .bind(service)
};

