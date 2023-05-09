'use strict';

/**
 * @namespace Search
 */

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');

server.extend(module.superModule);

server.get('ImproveSearch', cache.applyShortPromotionSensitiveCache, function (req, res, next) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');

    var apiProductSearch = new ProductSearchModel();
    apiProductSearch.setCategoryID('electronics');
    apiProductSearch.setSortingRule(CatalogMgr.getSortingRule('price-high-to-low'));
    apiProductSearch.setOrderableProductsOnly(true);
    apiProductSearch.search();

    res.json({
        'error': false,
        'message': 'Number of found products: ' + apiProductSearch.count
    });

    next();
});

module.exports = server.exports();