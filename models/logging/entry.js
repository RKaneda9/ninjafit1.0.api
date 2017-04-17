'use strict';

let helper = require('./helper'),
    utils  = require('../../helpers/utils');

class Entry {
    constructor(level, prefix, args, session, time) {

        this.id      = utils.rand();
        this.level   = level;
        this.prefix  = prefix;
        this.args    = args;
        this.session = session;
        this.time    = time || new Date();
    }
}

module.exports = Entry;