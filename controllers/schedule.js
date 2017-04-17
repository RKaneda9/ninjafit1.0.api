let express         = require('express'),
    cors            = require('cors'),
    calendarService = require('../services/calendar'),
    logging         = require('../middleware/logging'),
    status          = require('../helpers/status-codes'),
    router          = express.Router();

router.use(cors());
router.use(logging);

router.get('/calendar/month', (req, res) => {
    calendarService.getMonth(req.query.datekey)
        .then ((data)     => res.status(status.success.ok).json(data))
        .catch((e, props) => res.error(e, props));
});

router.get('/calendar/week', (req, res) => {
    calendarService.getWeek(req.query.datekey)
        .then ((data)     => res.status(status.success.ok).json(data))
        .catch((e, props) => res.error(e, props));
});

router.get('/calendar/day', (req, res) => {
    calendarService.getDay(req.query.datekey)
        .then ((data)     => res.status(status.success.ok).json(data))
        .catch((e, props) => res.error(e, props));
});

module.exports = router;