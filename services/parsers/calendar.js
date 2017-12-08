const
  cheerio = require('cheerio'),
  moment  = require('moment'),
  enums   = require('../../helpers/enums');

class CalendarDay {
  constructor(dateKey, items) {
    this.date      = dateKey;
    this.items     = items || [];
    this.retrieved = new Date();
  }
}

class CalendarItem {
  constructor(props) {
    if (!props) props = {};

    this.id      = adjust(props.id);
    this.type    = props.type;
    this.subtype = props.subtype;
    this.title   = adjust(props.title);
    this.desc    = adjust(props.desc);
    this.start   = props.start;
    this.end     = props.end;

    if (!this.type && !this.subtype) this.parseTypes(props.color);
  }

  setDetails(props) {
    if (!props) props = {};

    ['title', 'desc', 'start', 'end', 'duration'].forEach(key => {
      if (!this[key] && props[key]) {
        this[key] = adjust(props[key]);
      }
    });
  }

  parseTypes(color, title) {
    return this.parseTypesFromColor(color) || this.parseTypesFromTitle(title);
  }

  parseTypesFromColor(color) {
    color = color && color.trim().toLowerCase();

    switch (color) {
      case 'purple':
        this.type    = enums.event.type.class;
        this.subtype = enums.event.subtype.wod;
        return true;

      case 'green':
        this.type    = enums.event.type.class;
        this.subtype = enums.event.subtype.private;
        return true;

      case 'silver':
        this.type    = enums.event.type.class;
        this.subtype = enums.event.subtype.kids;
        return true;

      case 'red':
        this.type    = enums.event.type.class;
        this.subtype = enums.event.subtype.open;
        return true;

      case 'black':
        this.type    = enums.event.type.class;
        this.subtype = enums.event.subtype.unknown;
        return true;
    }

    return false;
  }

  parseTypesFromTitle(title) {
    title = (title || this.title).toLowerCase();

    if (title.includes('wod')) {
      this.type    = enums.event.type.class;
      this.subtype = enums.event.subtype.wod;
      return true;
    }

    if (title.includes('open gym')) {
      this.type    = enums.event.type.class;
      this.subtype = enums.event.subtype.open;
      return true;
    }

    if (title.includes('private')) {
      this.type    = enums.event.type.class;
      this.subtype = enums.event.subtype.private;
      return true;
    }

    if (title.includes('kids')) {
      this.type    = enums.event.type.class;
      this.subtype = enums.event.subtype.kids;
      return true;
    }

    return false;
  }
}

function adjust(str) {
  if (typeof str !== 'string') return str;

  return str.split('\n').join('').trim();
}

function parseWeek(html, datekey) {
  const $      = cheerio.load(html);
  const format = 'YYYY-MM-DD';
  const dayEls = $('.container[date]');
  const days   = [];
  const dates  = Array.apply(null, Array(7)).map((v, i) =>
    moment(datekey, 'YYYYMMDD').clone().add(i, 'days')
  );

  for (const date of dates) {
    const dayEl   = $(`.container[date=${date.format(format)}]`);
    const itemEls = dayEl ? dayEl.find('.item') : [];
    const dateKey = date.toDate().getDateKey();
    const day     = new CalendarDay(dateKey);

    for (let j = 0; j < itemEls.length; j++) {
      const itemEl = itemEls.eq(j);
      const item   = new CalendarItem({
        id:    itemEl.attr('id'),
        color: itemEl.attr('class').replace('item', '').replace('clickable', '').trim().toLowerCase(),
        title: itemEl.text()
      });

      day.items.push(item);
    }

    days.push(day);
  }

  return days;
}

// html = html string of an event item detail page from zenplanner
// item = calendar item
function fillItemDetails(html, item) {
  const $         = cheerio.load(html);
  const title     = $('.spaceBelow .spaceBelow span:first-child[style]').text();
  const desc      = $('.spaceBelow .spaceBelow .spaceBelow').text();
  const timeRange = $('#idPage table tr:nth-child(2) td.bold:last-child').text().toLowerCase();

  if (timeRange) {
    const pieces = timeRange.split('-');

    let start = parseInt(pieces[0]);
    let end   = parseInt(pieces[1]);

    if (isNaN(start)) start = 0;

    if (pieces.length && pieces[0].includes('pm')) {
      if (start < 12) start += 12;
    }
    else if (start === 12) start -= 12;

    if (isNaN(end)) {
      end = start + 1;
    }
    else if (pieces[1] && pieces[1].includes('pm')) {
      if (end < 12) end += 12;
    }
    else if (end === 12) end -= 12;

    const diff = (end - start) >= 0 ? (end - start) : (end + 24 - start);

    item.setDetails({
      start:    hourToTimeKey(start),
      end:      hourToTimeKey(end),
      duration: hourToTimeKey(diff)
    });
  }

  item.setDetails({ title, desc });

  return item;
}

function hourToTimeKey(hour) {
  return `${hour < 10 ? '0' : ''}${hour}00`;
}

module.exports = {
  parseWeek,
  fillItemDetails
};
