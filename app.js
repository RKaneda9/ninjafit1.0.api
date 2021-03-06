'use strict';

                require('./helpers/polyfills');
let express   = require('express'),
    parser    = require('body-parser'),
    constants = require('./helpers/constants'),
    app       = express();

app.use(parser.json());
app.use(express.static(__dirname + '/public'));

app.use('/api/contact',  require('./controllers/contact'));
app.use('/api/schedule', require('./controllers/schedule'));
app.use('/api/social',   require('./controllers/social'));
app.use('/api/workouts', require('./controllers/workouts'));
app.use('/api',          require('./controllers/index'));

app.listen(constants.port, function () {
    console.log(`Application started. Listening on port ${constants.port}.`);
});