Date.toDateKey   = function () { return new Date().toDateKey    (); };
Date.startOfWeek = function () { return new Date().toStartOfWeek(); };
Date.endOfWeek   = function () { return new Date().toEndOfWeek  (); };

Date.fromDateKey = function (datekey) {
    if (!datekey) { return new Date(); }

    datekey = datekey.toString();

    let year  = datekey.substr(0, 4);
    let month = datekey.substr(4, 2);
    let day   = datekey.substr(6, 2);

    return new Date(`${month}-${day}-${year}`);
};

Date.prototype.getDayOfWeekText = function () {
    switch (this.getDay()) {
        case  0: return 'Sunday';
        case  1: return 'Monday';
        case  2: return 'Tuesday';
        case  3: return 'Wednesday';
        case  4: return 'Thursday';
        case  5: return 'Friday';
        case  6: return 'Saturday';
    }
};

Date.prototype.toDateKey = function () {
    let day   = this.getDate();
    let month = this.getMonth() + 1;

    if (day   < 10) { day   = '0' + day;   }
    if (month < 10) { month = '0' + month; }

    return parseInt(`${this.getFullYear()}${month}${day}`);
};

Date.prototype.clone = function () {
    return new Date(this); 
};

Date.prototype.addYears = function (val) {
    this.setFullYear(this.getFullYear() + val);
    return this;
};

Date.prototype.addDays = function (val) {
    this.setDate(this.getDate() + val);
    return this;
};

Date.prototype.toStartOfWeek = function () {
    this.setDate(this.getDate() - this.getDay());
    return this;
};

Date.prototype.toEndOfWeek = function () {
    this.setDate(this.getDate() + (6 - this.getDay()));
    return this;
};

Date.prototype.toStartOfMonth = function () {
    this.setDate(1);
    return this;
};

Date.prototype.toEndOfMonth = function () {
    this.setMonth(this.getMonth() + 1);
    this.setDate (0);
    return this;
};