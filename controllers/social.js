let express = require('express'),
    cors    = require('cors'),
    logging = require('../middleware/logging'),
    status  = require('../helpers/status-codes'),
    router  = express.Router(),

    facebookService  = require('../services/facebook'),
    instagramService = require('../services/instagram');

router.use(cors());
router.use(logging);

router.get('/facebook', (req, res) => {
    facebookService.getFeed()
        .then ((data)     => res.status(status.success.ok).json(data))
        .catch((e, props) => res.error(e, props));
});

router.get('/instagram', (req, res) => {
    instagramService.getFeed()
        .then ((data)     => res.status(status.success.ok).json(data))
        .catch((e, props) => res.error(e, props));
});

router.get('/', (req, res) => {

    Promise.all([
         facebookService.getFeed(),
        instagramService.getFeed()
    ]).then(responses => {

        res.status(status.success.ok).json({
             facebook: responses[0],
            instagram: responses[1]
        });

    }).catch((e, props) => res.error(e, props));
});

module.exports = router;