const {Router} = require('express');
const router = Router();
const ApiWcController = require('../controllers/ApiWcController');

router.get('/attributes',
    ApiWcController.getAllAtributes
);

router.get('/terms',
    ApiWcController.getAllTerms
);

router.get('/product',
    ApiWcController.getProductBySku
);

router.post('/create-one-variant',
    ApiWcController.createProductVariant
);

router.post('/add-all-attributes',
    ApiWcController.addAttributeInProduct
);

router.post('/create-attributes',
    ApiWcController.createProductAtribute
)

module.exports = router;

