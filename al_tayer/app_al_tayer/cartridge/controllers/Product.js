'use strict';

/**
 * @namespace Product
 */

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');
var authorization = require('*/cartridge/scripts/middleware/authorization');

server.extend(module.superModule);

/**
 * Product-Get : This endpoint returns product JSON
 * @name Base/Product-Get
 * @function
 * @memberof Product
 * @param {middleware} - server.middleware.https
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.get('Get', server.middleware.https, cache.applyPromotionSensitiveCache, function (req, res, next) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

    res.json({
        product: ProductFactory.get(req.querystring)
    });
    next();
});

/**
 * Product-Delete : This endpoint deletes product using a OCAPI request
 * @name Base/Product-Delete
 * @function
 * @memberof Product
 * @param {middleware} - server.middleware.https
 * @param {middleware} - authorization.ensureBasicAuth
 * @param {httpparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('Delete', server.middleware.https, authorization.ensureBasicAuth, function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var StringUtils = require('dw/util/StringUtils');
    var ocapiHelper = require('*/cartridge/scripts/helpers/ocapiHelper');

    var productID = req.form.pid;
    var logger = Logger.getLogger('ProductUpdates', 'productUpdates');

    if (!empty(productID)) {
        var serviceResponse = ocapiHelper.send({
            layer: ocapiHelper.DATA_LAYER,
            path: StringUtils.format(
                'products/{0}',
                productID,
            ),
            method: 'DELETE'
        });
        res.json({
            'error': false
        });
        if (!serviceResponse.ok) {
            logger.error('Error when deleting a product {0} due to: {1}', productID, serviceResponse.errorMessage);
            // errorMessage value can be set in resource file if needed
            res.json({
                'error': true,
                'errorMessage': 'The server encountered an unexpected condition that prevented it from fulfilling the request.'
            });
            res.setStatusCode(500);
        }
        return next();
    }
    res.json({
        'error': true,
        'errorMessage': 'Product ID is missing'
    });
    res.setStatusCode(404);
    next();
});

/**
 * Product-UpdateInventory : This endpoint updates product inventory using a OCAPI request
 * @name Base/Product-UpdateInventory
 * @function
 * @memberof Product
 * @param {middleware} - server.middleware.https
 * @param {middleware} - authorization.ensureBasicAuth
 * @param {httpparameter} - pid - Product ID
 * @param {httpparameter} - inventoryListID - Inventory List ID
 * @param {httpparameter} - quantity - New product ATS
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('UpdateInventory', server.middleware.https, authorization.ensureBasicAuth, function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var StringUtils = require('dw/util/StringUtils');
    var ocapiHelper = require('*/cartridge/scripts/helpers/ocapiHelper');

    var productID = req.form.pid;
    var quantity = req.form.quantity;
    var inventoryListID = req.form.inventoryListID;
    var logger = Logger.getLogger('ProductUpdates', 'productUpdates');

    if (!empty(productID) && !empty(inventoryListID) && !empty(quantity)) {
        var serviceResponse = ocapiHelper.send({
            layer: ocapiHelper.DATA_LAYER,
            path: StringUtils.format(
                'inventory_lists/{0}/product_inventory_records/{1}',
                inventoryListID,
                productID,
            ),
            method: 'PATCH',
            body:
            {
                "allocation": {
                    "amount": new Number(quantity)
                }
            }
        });
        res.json({
            'error': false
        });
        if (!serviceResponse.ok) {
            logger.error('Error when updating a product {0} due to: {1}', productID, serviceResponse.errorMessage);
            // errorMessage value can be set in resource file if needed
            res.json({
                'error': true,
                'errorMessage': 'The server encountered an unexpected condition that prevented it from fulfilling the request.'
            });
            res.setStatusCode(500);
        }
        return next();
    }

    res.json({
        'error': true,
        'errorMessage': 'Either Product ID, Inventory List ID or Quantity is missing.'
    });
    next();
});

module.exports = server.exports();
