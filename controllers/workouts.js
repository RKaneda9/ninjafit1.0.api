let express    = require('express'),
    cors       = require('cors'),
    wodService = require('../services/wod'),
    logging    = require('../middleware/logging'),
    status     = require('../helpers/status-codes'),
    router     = express.Router();

router.use(cors());
router.use(logging);

router.get('/wod', (req, res) => {
    wodService.get(req.query.datekey)
        .then ((data)     => res.status(status.success.ok).json(data))
        .catch((e, props) => res.error(e, props));
});

module.exports = router;