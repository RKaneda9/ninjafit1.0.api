let Logger    = require('../models/logging/logger'),
    constants = require('../helpers/constants'),
    status    = require('../helpers/status-codes'),
    utils     = require('../helpers/utils'),
    enums     = require('../helpers/enums'),
    fs        = require('fs');

let methods = {
    get:    "GET",
    post:   "POST",
    put:    "PUT",
    delete: "DELETE"
};

let port = constants.port ? `:${constants.port}` : '';

// ensuring that all file paths exist.
utils.foreach(constants.logging.filePaths, function (path) {
    let pieces   = path.split('/');
    let location = "";

    utils.foreach(pieces, function (piece) {

        // if piece is empty, we've reached the end of the path
        // return early and break out of loop
        if (!piece) { return false; }

        location += location ? `/${piece}` : piece;

        if (!fs.existsSync(location)) {
            fs.mkdirSync(location); 
        }
    });
});

module.exports = (req, res, next) => {

    let log  = Logger.newSession(),
        json = res.json,
        send = res.send;

    log.info(`${req.protocol}://${req.hostname}${port}${req.path}`, req.method, {
        ip:    req.ip,
        body:  req.body,
        query: req.query,
        xhr:   req.xhr,
        route: req.route
    });

    req.log = log;

    res.json = function (data) {
        log.info('Response: ', res.statusCode, data);
        log.flush();

        delete log;

        json.apply(res, arguments);
    };

    res.send = function (data) {
        log.info('Response: ', res.statusCode, data);
        log.flush();

        delete log;

        send.apply(res, arguments);
    };

    res.error = function (e, props) {
        log.error(e, props);

        res
            .status(status.serverError.internal)
            .send  (props.message);
    };

    next();
};