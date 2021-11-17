const {Router} = require('express');
const router = Router();
const ApiWcController = require('../controllers/ApiWcController');

router.get('/',
    ApiWcController.getAllAtributes
);

router.get('/terms',
    ApiWcController.getAllTerms
);

router.post('/',
    ApiWcController.createProductAtribute
)

module.exports = router;

