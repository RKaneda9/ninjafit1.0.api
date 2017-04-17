let fs        = require('fs'),
    utils     = require('../../helpers/utils'),
    constants = require('../../helpers/constants').logging,
    enums     = require('../../helpers/enums')    .logging;

let helper = {

    parseErrorArg: (err) => (
        {
            type    : err.name,
            message : err.message,
            stack   : err.stack
        }
    ),

    getDateStr: (date, spacer) => {

        let today = date || new Date(),
            month = (today.getMonth() + 1).toString(),
            day   =  today.getDate ()     .toString(),
            year  =  today.getFullYear();

        if (month.length < 2) { month  = '0' + month; }
        if (day  .length < 2) { day    = '0' + day;   }
        if (!spacer)          { spacer = '-';         }

        return `${year}${spacer}${month}${spacer}${day}`;
    },

    getTimeStr: (date, spacer) => {

        let now     = date || new Date(),
            hours   = helper.pad(now.getHours()),
            minutes = helper.pad(now.getMinutes()),
            seconds = helper.pad(now.getSeconds());

        if (!spacer) { spacer = ':'; }

        return `${hours}${spacer}${minutes}${spacer}${seconds}`;
    },

    pad: (val, length) => (("00000" + val).slice(-1 * (length || 2))),

    formatEntryRaw: (entry, session) => {
        var args = utils.map(entry.args, arg => {

            if (arg instanceof Error) { 
                return helper.parseErrorArg(arg);
            }
        
            return arg;
        });

        return JSON.stringify({

            id     : entry.id,
            level  : entry.level,
            prefix : entry.prefix,
            session: session,
            args   : args,
            time   : helper.getTimeStr(entry.time)

        }, null, "\t");
    },

    formatEntryString: (entry, indent) => {
        let str = `${entry.prefix.toUpperCase()} ${helper.getTimeStr(entry.time)} `;

        if (indent) {
            return str + utils.map(entry.args, arg => {

                if (arg instanceof Error) { 
                    return JSON.stringify(helper.parseErrorArg(arg), null, "\t")
                        .split('\\n    ').join('\n\t\t')
                        .split('\\\\')   .join('\\'); 
                }    

                if (typeof arg === 'object') { 

                    return JSON.stringify(arg, null, "\t")
                        .split('\n').join('\n\t'); 
                }
            
                return arg;

            }).join(' ');
        }
        else {
            return str + utils.map(entry.args, arg => {

                if (arg instanceof Error) { 
                    return JSON.stringify(helper.parseErrorArg(arg));
                }    

                if (typeof arg === 'object') { 
                    return JSON.stringify(arg);
                }
            
                return arg;

            }).join(' ');
        }
    },

    saveEntries: (_entries, settings) => {
        let entries  = _entries.splice(0);
        let nowStr   = helper.getDateStr();
        let filename = settings.session;
        let prefix   = settings.prefix;

        let raw = {
            path: constants.filePaths.raw,
            ext : constants.fileExt  .raw,
            save: settings.save.raw,
            name: nowStr
        };

        let str = {
            path: `${constants.filePaths.str}${nowStr}/`,
            ext : constants.fileExt  .str,
            save: settings.save.str,
            name: settings.session.split(':').join('-')
        };

        if (raw.save > enums.levels.none) {

            raw.full = `${raw.path}${raw.name}${raw.ext}`;

            raw.entries = utils.map(entries, entry => {
                
                if (raw.save >= entry.level) {
                    return helper.formatEntryRaw(entry, settings.session);
                }

            }).join(',\n');

            if (raw.entries.length) {

                if (!fs.existsSync(raw.path)) { fs.mkdirSync(raw.path); }

                if (fs.existsSync(raw.full)) { raw.entries = ",\n" + raw.entries; }
                
                // save raw objects
                fs.appendFile(raw.full, raw.entries, (err) => {
                    if (err) { console.error('Error saving raw log!', err, raw.full); }
                });
            }
        }

        if (str.save > enums.levels.none) {

            str.full = `${str.path}${str.name}${str.ext}`;

            str.entries = utils.map(entries, entry => {

                if (str.save >= entry.level) {
                    return `${prefix}${helper.formatEntryString(entry)}`;
                }

            }).join('\n') + '\n';

            if (str.entries.length) {

                if (!fs.existsSync(str.path)) { fs.mkdirSync(str.path); }

                // save log entries
                fs.appendFile(str.full, str.entries, (err) => {
                    if (err) { console.error('Error saving to log file!', err, str.full); }
                });
            }
        }
    }
};

module.exports = helper;