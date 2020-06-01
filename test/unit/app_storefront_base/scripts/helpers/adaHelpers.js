'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('adaHelpers', function () {
    var adaHelpers = proxyquire('../../../../../cartridges/app_storefront_base/cartridge/scripts/helpers/adaHelpers', {});
    it('should return a string that does not contain the value attribute, last value', function () {
        var testString = 'name="nameVal" id="idVal" value=""';
        var result = adaHelpers.removeDuplicateValueAttr(testString);
        assert.equal(result.indexOf('value='), -1);
    });

    it('should return a string that does not contain the value attribute, first value', function () {
        var testString = 'value="" name="nameVal" id="idVal" ';
        var result = adaHelpers.removeDuplicateValueAttr(testString);
        assert.equal(result.indexOf('value='), -1);
    });

    it('should return a string that does not contain the value attribute, middle value', function () {
        var testString = 'name="nameVal" value="" id="idVal"';
        var result = adaHelpers.removeDuplicateValueAttr(testString);
        assert.equal(result.indexOf('value='), -1);
    });
});
