let express         = require('express'),
    cors            = require('cors'),
    calendarService = require('../services/calendar'),
    logging         = require('../middleware/logging'),
    status          = require('../helpers/status-codes'),
    router          = express.Router();

router.use(cors());
router.use(logging);

// router.get('/calendar/month', async (req, res) => {
//     try {
//         await calendarService.getMonth(req.query.datekey)
//             .then ((data)     => res.status(status.success.ok).json(data))
//             .catch((e, props) => res.error(e, props));
//     }
//     catch (e) { res.error(e); }
// });

router.get('/calendar/week', async (req, res) => {
  try {
    const data = await calendarService.getWeek(req.query.datekey);

    res.status(status.success.ok).json(data);
  }
  catch (e) { res.error(e); }
});

router.get('/calendar/day', async (req, res) => {
    try {
      const data = await calendarService.getDay(req.query.datekey);

      res.status(status.success.ok).json(data);
    }
    catch (e) { res.error(e); }
});

module.exports = router;
