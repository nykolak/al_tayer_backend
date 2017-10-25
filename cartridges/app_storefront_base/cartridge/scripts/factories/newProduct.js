'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Product = require('*/cartridge/models/product/product');
var collections = require('*/cartridge/scripts/util/collections');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');
var fullProduct = require('*/cartridge/models/product/fullProduct');
var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Return type of the current product
 * @param  {dw.catalog.ProductVariationModel} product - Current product
 * @return {string} type of the current product
 */
function getProductType(product) {
    var result;
    if (product.master) {
        result = 'master';
    } else if (product.variant) {
        result = 'variant';
    } else if (product.variationGroup) {
        result = 'variationGroup';
    } else if (product.productSet) {
        result = 'set';
    } else if (product.bundle) {
        result = 'bundle';
    } else if (product.optionProduct) {
        result = 'optionProduct';
    } else {
        result = 'standard';
    }
    return result;
}

/**
 * Normalize product and return Product variation model
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @param  {Object} productVariables - variables passed in the query string to
 *                                     target product variation group
 * @return {dw.catalog.ProductVarationModel} Normalized variation model
 */
function getVariationModel(product, productVariables) {
    var variationModel = product.variationModel;
    if (!variationModel.master && !variationModel.selectedVariant) {
        variationModel = null;
    } else if (productVariables) {
        var variationAttrs = variationModel.productVariationAttributes;
        Object.keys(productVariables).forEach(function (attr) {
            if (attr && productVariables[attr].value) {
                var dwAttr = collections.find(variationAttrs,
                    function (item) { return item.ID === attr; });
                var dwAttrValue = collections.find(variationModel.getAllValues(dwAttr),
                    function (item) { return item.value === productVariables[attr].value; });

                if (dwAttr && dwAttrValue) {
                    variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                }
            }
        });
    }
    return variationModel;
}

/**
 * Get full product model
 * @param {Object} product - Product Model
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Full product model
 */
function getFullProduct(product, apiProduct, params) {
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    if (params.variables) {
        var variations = Product.getVariationModel(apiProduct, params.variables);
        if (variations) {
            apiProduct = variations.getSelectedVariant() || apiProduct; // eslint-disable-line
        }
    }
    var variationModel = getVariationModel(apiProduct, params.variables);
    var optionsModel = productHelper.getCurrentOptionModel(apiProduct.optionModel, params.options);
    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: params.variables
    };
    return fullProduct(product, apiProduct, options);
}

module.exports = {
    get: function (params) {
        var productId = params.pid;
        var apiProduct = ProductMgr.getProduct(productId);
        var productType = getProductType(apiProduct);
        var product = new Product(apiProduct, productType);

        switch (productType) {
            case 'set':
                if (params.pview === 'tile') {
                    product = productTile(product, apiProduct);
                } else {
                    product = getFullProduct(product, apiProduct, params);
                    decorators.setIndividualProducts(product, apiProduct, this);
                }
                break;
            case 'bundle':
            default:
                switch (params.pview) {
                    case 'tile':
                        product = productTile(product, apiProduct);
                        break;
                    case 'productLineItem':
                    default:
                        product = getFullProduct(product, apiProduct, params);
                        break;
                }
        }

        return product;
    }
};
