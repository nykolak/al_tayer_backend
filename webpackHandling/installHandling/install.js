'use strict';

/**
 * Multicartridge npm installer command.
 */

var sfraBuilderConfig = require('../webpackHandling/sfraBuilderConfig');
var npmInstallHelper = require('./installHelper');

(function () {
    sfraBuilderConfig.cartridges.forEach(function (cartridge) {
        npmInstallHelper.npmInstall(cartridge);
    });
}());
