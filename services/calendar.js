const
  moment  = require('moment'),
  http    = require('../helpers/http'),
  utils   = require('../helpers/utils'),
  {check} = require('../helpers/validator'),
  log     = require('../helpers/logger'),
  parser  = require('./parsers/calendar');

class CalendarService {
    constructor(props) {
      this.storage  = {};
      this.settings = {
        requestWeekEndpoint: "https://ninjafitgyms.sites.zenplanner.com/calendar.cfm?date={date}&view=WEEK",
        requestItemEndpoint: "https://ninjafitgyms.sites.zenplanner.com/loginSignup.cfm?appointmentId={id}", //example: "https://ninjafitgyms.sites.zenplanner.com/loginSignup.cfm?appointmentId=04CFCC6C-EDEA-41FE-A95B-7A8430DFCCF4&loginReturn=enrollment.cfm?appointmentId=04CFCC6C-EDEA-41FE-A95B-7A8430DFCCF4"
        storageExpiration:   15, // minutes
        startTimeKey:        "0600", // start time for calendar view
        endTimeKey:          "2100"  // end time for calendar view
      };

      utils.extend(this.settings, props, true);

      const format = msg => `calendarService configuration error. ${msg}. Please see readme for configuration instructions.`;

      if (!check(this.settings.storageExpiration).isInt   ()           .isValid) { throw format(`"config.storageExpiration" must be a positive integer`); }
      if (!check(this.settings.startTimeKey)     .isString().notEmpty().isValid) { throw format(`"config.startTimeKey" must be a valid timekey in the format hhmm`); }
      if (!check(this.settings.endTimeKey)       .isString().notEmpty().isValid) { throw format(`"config.endTimeKey" must be a valid timekey in the format hhmm`); }
    }

    async getWeek(datekey) {
      const date  = this.parseDateKeyParam(datekey);
      const start = date.clone().toStartOfWeek();
      const end   = date.clone().toEndOfWeek();

      const results = this.getRangeFromStorage(start, end);

      if (results) return results;

      return await this.requestWeek(start);
    }

    async getDay(datekey) {
      const date    = this.parseDateKeyParam(datekey);
      const results = this.getRangeFromStorage(date);

      if (results) return results;

      return await this.requestWeek(date.clone().toStartOfWeek());
    }

    getRangeFromStorage(start, end) {
      const days = [];

      let temp = start.clone(),
        datekey, dayData, invalid, results;

      do {
        datekey = temp.getDateKey();
        dayData = this.storage[datekey];

        if (this.isDayExpired(dayData)) {
          invalid = true;
          break;
        }
        else {
          days.push({
            date:  dayData.date,
            items: dayData.items
          });
        }

        temp.addDays(1);

      } while (temp <= end);

      return invalid ? null : this.toResults(days);
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

    async requestWeek(dateKey) {
      try {
        if (!dateKey) dateKey = new Date().getDateKey();

        const date = moment(dateKey, 'YYYYMMDD').format('YYYY-MM-DD');
        const url  = this.settings.requestWeekEndpoint.split('{date}').join(date);
        const body = await http.get(url);
        const days = parser.parseWeek(body, dateKey);

        for (const day of days) {
          for (const item of day.items) {

            const endpoint = this.settings.requestItemEndpoint.split('{id}').join(item.id);
            const html     = await http.get(endpoint);

            parser.fillItemDetails(html, item);
          }

          // saving day to storage.
          this.storage[day.date] = day;
        }

        return this.toResults(days);
      }
      catch (err) {
        log.error('There was an error while attempting to retrieve week results:\n', err);
        return this.toResults();
      }
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
        days:  days || []
      };
    }
}

const service = new CalendarService((require('../settings.json') || {}).calendar);
Object.freeze(service);

module.exports = {
    getWeek: service.getWeek.bind(service),
    getDay:  service.getDay .bind(service)
};
