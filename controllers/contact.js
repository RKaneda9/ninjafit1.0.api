let express = require('express'),
    cors    = require('cors'),
    logging = require('../middleware/logging'),
    status  = require('../helpers/status-codes'),
    mailer  = require('../services/mailer'),
    router  = express.Router();

router.use(cors());
router.use(logging);

router.post('/message', (req, res) => {

    mailer.send(req.body)
        .then ((data)     => res.status(status.success.ok).json(data))
        .catch((e, props) => res.error(e, props));
});

module.exports = router;