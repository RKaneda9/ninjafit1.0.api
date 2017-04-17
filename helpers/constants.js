module.exports = {
    port: 5100,

    logging: {
        filePaths: {
            raw: 'database/logs/',
            str: 'logs/'
        },

        fileExt: {
            raw: '.json',
            str: '.log'
        },

        flushTimeout: 15000
    }
};