'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function proxyModel() {
    return proxyquire('../../../cartridges/app_storefront_base/cartridge/models/shippingState.js', {});
}

module.exports = proxyModel();
