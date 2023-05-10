"use strict";

function execute(args) {
    var Order = require('dw/order/Order');
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
        try {
            var orderCustomObject = allOrderCustomObjects.next();
            var orderID = orderCustomObject.custom.orderID.split('-')[0];
            var order = OrderMgr.getOrder(orderID);
            Transaction.wrap(function () {
                if (!empty(orderCustomObject.custom.orderStatus)) {
                    order.setStatus(orderCustomObject.custom.orderStatus);
                }
                if (!empty(orderCustomObject.custom.shipments)) {
                    JSON.parse(orderCustomObject.custom.shipments).forEach(function (customObjectShipment) {
                        var shipmentID = customObjectShipment.shipmentNo;
                        var shipmentStatus = customObjectShipment.status;

                        // Update the shipment shipping status
                        var orderShipments = order.getShipments();
                        var orderShipment = collections.find(orderShipments, function (shipment) {
                            return shipment.shipmentNo === shipmentID;
                        });
                        orderShipment.setShippingStatus(shipmentStatus);

                        // Update the external inventory management system
                        var requestData = collections.map(orderShipment.productLineItems, function (productLineItem) {
                            return ({
                                'productID': productLineItem.productID,
                                'amount': productLineItem.quantityValue
                            });
                        });
                        var serviceResponse = DemoInventoryService.reduceStock().call(requestData);
                        if (!serviceResponse.ok) {
                            throw new Error('Service Failed due to: ' + serviceResponse.errorMessage);
                        }

                        // Update the order shipping status
                        var numberOfShippedShippments = 0;
                        collections.forEach(orderShipments, function (orderShipment) {
                            if (orderShipment.shippingStatus.value === dw.order.Shipment.SHIPPING_STATUS_SHIPPED) {
                                numberOfShippedShippments++;
                            }
                        })
                        if (numberOfShippedShippments === orderShipments.length) {
                            order.setShippingStatus(Order.SHIPPING_STATUS_SHIPPED);
                        } else if (numberOfShippedShippments > 0) {
                            order.setShippingStatus(Order.SHIPPING_STATUS_PARTSHIPPED);
                        } else {
                            order.setShippingStatus(Order.SHIPPING_STATUS_NOTSHIPPED);
                        }
                    });
                }

                // Delete custom object after it's successfully processed
                CustomObjectMgr.remove(orderCustomObject);
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