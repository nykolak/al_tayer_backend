"use strict";

function execute(args) {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var DemoInventoryService = require('*/cartridge/scripts/services/demoInventory');

    if (!args.Enabled) {
        return new Status(Status.OK, '', 'Step disabled, skipping it.');
    }

    var hasError = false;
    var logger = Logger.getLogger('OrderUpdates', 'orderUpdates');
    var allOrderCustomObjects = CustomObjectMgr.queryCustomObjects('OrderUpdate', '', null);

    while (allOrderCustomObjects.hasNext()) {
        var orderCutomObject = allOrderCustomObjects.next();
        var orderID = orderCutomObject.custom.orderID.split('-')[0];
        var order = OrderMgr.getOrder(orderID);
        try {
            Transaction.wrap(function () {
                if (!empty(orderCutomObject.custom.orderStatus)) {
                    order.setStatus(orderCutomObject.custom.orderStatus);
                }
                if (!empty(orderCutomObject.custom.shippingStatus)) {
                    var defaultShipment = order.getDefaultShipment();
                    var requestData = [];
                    collections.forEach(defaultShipment.productLineItems, function (productLineItem) {
                        requestData.push(
                            {
                                'productID': productLineItem.productID,
                                'amount': productLineItem.quantityValue
                            });
                    });
                    var serviceResponse = DemoInventoryService.reduceStock().call(requestData);
                    if (serviceResponse.ok) {
                        order.getDefaultShipment().setShippingStatus(orderCutomObject.custom.shippingStatus);
                        order.setShippingStatus(orderCutomObject.custom.shippingStatus);
                    } else {
                        throw new Error('Service Failed due to: ' + serviceResponse.errorMessage);
                    }
                }
            });
        } catch (error) {
            hasError = true;
            logger.fatal('Error when processing a notification for order {0} due to: {1}', orderID, error.message);
        }
    }

    return hasError ? new Status(Status.ERROR, '', 'Step completed with errors') : new Status(Status.OK, '', 'Step completed without errors');
}

module.exports = {
    execute: execute
};