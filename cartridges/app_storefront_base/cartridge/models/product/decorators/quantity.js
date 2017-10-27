'use strict';

var DEFAULT_MAX_ORDER_QUANTITY = 9;

module.exports = function (object, product, quantity) {
    Object.defineProperty(object, 'selectedQuantity', {
        enumerable: true,
        value: quantity || (product && product.minOrderQuantity ? product.minOrderQuantity.value : 1)
    });
    Object.defineProperty(object, 'minOrderQuantity', {
        enumerable: true,
        value: product.minOrderQuantity.value || 1
    });
    Object.defineProperty(object, 'maxOrderQuantity', {
        enumerable: true,
        value: DEFAULT_MAX_ORDER_QUANTITY
    });
};