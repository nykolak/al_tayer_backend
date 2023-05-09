'use strict';

/**
 * @namespace Order
 */

var server = require('server');

var authorization = require('*/cartridge/scripts/middleware/authorization');

/**
 * Order-Update : The Account-SavePassword endpoint is the endpoit that handles changing the shopper's password
 * @name Base/Order-Update
 * @function
 * @memberof Order
 * @param {middleware} - server.middleware.https
 * @param {middleware} - authorization.ensureBasicAuth
 * @param {httpparameter} - orderID - Input field for the shopper's current password
 * @param {httpparameter} - orderStatus - Input field for the shopper's new password
 * @param {httpparameter} - shippingStatus - Input field for the shopper to confirm their new password
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('Update', server.middleware.https, authorization.ensureBasicAuth, function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var Calendar = require('dw/util/Calendar');
    var OrderMgr = require('dw/order/OrderMgr');
    var StringUtils = require('dw/util/StringUtils');
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');

    var logger = Logger.getLogger('OrderUpdates', 'orderUpdates');
    var orderID = req.form.orderID;
    var orderStatus = req.form.orderStatus;
    var shippingStatus = req.form.shippingStatus;

    if (!empty(orderID) && (!empty(orderStatus) || !empty(shippingStatus))) {
        var order = OrderMgr.getOrder(orderID);
        if (empty(order)) {
            logger.fatal('Notification for not existing order {0} received.', orderID);
            res.json({
                'error': true,
                'errorMessage': 'This order doesn\'t exists'
            });
            res.setStatusCode(404);
            return next();
        }
        var customObjectID = [orderID, StringUtils.formatCalendar(new Calendar(), 'yyyyMMddhhmmssSSS')].join("-");
        try {
            Transaction.wrap(function () {
                var customObject = CustomObjectMgr.createCustomObject('OrderUpdate', customObjectID);
                if (!empty(orderStatus)) {
                    customObject.custom.orderStatus = new Number(orderStatus);
                }
                if (!empty(shippingStatus)) {
                    customObject.custom.shippingStatus = new Array(shippingStatus);
                }
            });
        } catch (error) {
            logger.fatal('Error when create a notification for order {0} due to: {1}', orderID, error.message);
            var a = error.message;
            res.json({
                'error': true,
                'errorMessage': 'The server encountered an unexpected condition that prevented it from fulfilling the request.'
            });
            res.setStatusCode(500);
            return next();
        }
    }

    res.json({
        'success': true
    });
    return next();
});

module.exports = server.exports();
