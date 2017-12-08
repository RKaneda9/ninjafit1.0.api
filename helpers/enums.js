module.exports = {
    logging: {
        levels: {
            none:  0,
            error: 1,
            warn:  2,
            info:  3,
            debug: 4
        }
    },
    event: {
        type: {
            unknown: undefined,
            class:   'class',
            event:   'event'
        },
        subtype: {
            unknown: undefined,
            private: 'private',
            kids:    'kids',
            wod:     'wod',
            open:    'open'
        }
    }
};
