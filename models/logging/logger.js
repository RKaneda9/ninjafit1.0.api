'use strict';

let Entry     = require('./entry'),
    chalk     = require('chalk'),
    fs        = require('fs'),
    helper    = require('./helper'),
    utils     = require('../../helpers/utils'),
    enums     = require('../../helpers/enums')    .logging,
    constants = require('../../helpers/constants').logging;

class Logger {

    constructor(props) {

        this.entries        = [];
        this.flushTimeoutId = null;
        this.lastFlushTime  = null;
        
        this.setSettings(props);
    }

    setSettings(props) {

        if (!props) { props = {}; }

        this.settings = {
            prefix:  props.prefix  || '',
            session: props.session || "system",
            save: {
                raw: props.saveRawLevel != null ? props.saveRawLevel : enums.levels.error,
                str: props.saveStrLevel != null ? props.saveStrLevel : enums.levels.debug
            },
            console: {
                level: props.logToConsoleLevel != null ? props.logToConsoleLevel : enums.levels.error
            }
        };
    }

    flush() {

        if (this.flushTimeoutId) { return; }

        this.flushTimeoutId = setTimeout(async () => {
            
            helper.saveEntries(this.entries, this.settings);
            this.lastFlushTime  = new Date();
            this.flushTimeoutId = null;
            
        }, constants.flushTimeout);
    }

    debug() { this.log(enums.levels.debug, 'DEBUG', arguments, console.log,   chalk.green      ); }
    info () { this.log(enums.levels.info,  'INFO',  arguments, console.info,  chalk.gray       ); }
    warn () { this.log(enums.levels.warn,  'WARN',  arguments, console.warn,  chalk.bold.yellow); }
    error() { this.log(enums.levels.error, 'ERROR', arguments, console.error, chalk.red        ); }

    log(level, prefix, args, logFunc, colorFunc) {

        let entry = new Entry(level, prefix, args, this.session);

        if (logFunc && this.settings.console.level >= level) {
            let str = helper.formatEntryString(entry, true);

            logFunc(colorFunc ? colorFunc(str) : str);
        }

        this.entries.push(entry);
        this.flush();
    }

    static newSession (session) { 
        return new Logger({ 
            session: `${helper.getTimeStr()}-${session || utils.rand(10)}` 
        }); 
    }
}

module.exports = Logger;