let cheerio = require('cheerio'),
    enums   = require('../../helpers/enums');

let helper = {

    toTimeKey (hour) {
        return `${hour < 10 ? '0' : ''}${hour}00`;
    },

    adjustDateKey (datekey, day) {
        while (day.length < 2) { day = '0' + day; }
        return `${datekey.toString().slice(0,6)}${day}`;
    },

    parseDay (el, datekey) {
        let els, text, item, day, i;

        els  = el.find('.clickable');
        text = el.find('.dayLabel').text().trim();
        day  = { 
            date:  helper.adjustDateKey(datekey, text),
            items: []
        };

        for (i = 0; i < els.length; i++) {
            item = helper.parseItem(els.eq(i), datekey);
            day.items.push(item);
        }

        return day;
    },

    parseItem (el, datekey) {
        let item, attr, text, start, end;

        item = {};
        attr = el.attr('onclick');

        if (attr.includes('enrollment.cfm')) {
            item.type = enums.event.type.class;

            attr = el.attr('class').toLowerCase();

                 if (attr.includes('purple')) { item.subtype = enums.event.subtype.wod;     }
            else if (attr.includes('green'))  { item.subtype = enums.event.subtype.private; }
            else if (attr.includes('silver')) { item.subtype = enums.event.subtype.kids;    }
            else                              { item.subtype = enums.event.subtype.unknown; }
        }
        else if (attr.includes('event.cfm')) {

            item.type = enums.event.type.event;
        }
        else {

            item.type = enums.event.type.unknown;
        }

        text  = el.text().trim().substr(0, 4);
        start = parseInt(text);

        if (text.toLowerCase().includes('pm')) { 
            if (start < 12) start += 12; 
        }
        else if (start == 12) { start = 0; }

        end = start + 1;

        if (end > 23) { end = 0; }

        // to timekey
        item.start    = helper.toTimeKey(start);
        item.end      = helper.toTimeKey(end);
        item.duration = '0100'; // right now everything is 1 hour.
        item.title    = el.text().trim().substr(4).trim();
        
        return item;
    }
}

module.exports = (html, datekey) => {
    let $    = cheerio.load(html),
        els  = $('.thisMonth'),
        days = [],
        i;

    for (i = 0; i < els.length; i++) {
        day = helper.parseDay(els.eq(i), datekey);
        days.push(day);
    }

    return days;
};