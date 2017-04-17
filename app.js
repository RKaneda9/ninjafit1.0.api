'use strict';

                require('./helpers/polyfills');
let express   = require('express'),
    parser    = require('body-parser'),
    constants = require('./helpers/constants'),
    app       = express();

app.use(parser.json());
app.use(express.static(__dirname + '/public'));

app.use('/schedule', require('./controllers/schedule'));
app.use('/workouts', require('./controllers/workouts'));
app.use(             require('./controllers/index'));

app.listen(constants.port, function () {
    console.log(`Application started. Listening on port ${constants.port}.`);
});