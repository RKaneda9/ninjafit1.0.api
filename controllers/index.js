let express = require('express'),
    cors    = require('cors'),
    logging = require('../middleware/logging'),
    status  = require('../helpers/status-codes'),
    router  = express.Router();

router.use(cors());
router.use(logging);

router.get('/ping', (req, res) => {
    res.status(status.success.ok).send('Still here!');
});

module.exports = router;
