'use strict';
/* global request, response */

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

/**
 * Render logic for the product detail page.
 *
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();

    var renderParams = {};
    try {
        renderParams = JSON.parse(context.runtimeParameters);
    } catch (e) {
        // TODO this should never happen, maybe log an error if it does?, but try to continue without the params
    }

    model.action = renderParams.action;
    model.queryString = renderParams.queryString;
    model.locale = renderParams.locale;

    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var page = context.page;
    model.page = page;

    var content = context.content;
    if (content.product) {
        var params = { pid: content.product.ID };
        var product = ProductFactory.get(params);

        pageMetaHelper.setPageMetaData(request.pageMetaData, product);
        pageMetaHelper.setPageMetaTags(request.pageMetaData, product);
    }

    // automatically register configured regions
    model.regions = PageRenderHelper.getRegionModelRegistry(page);

    // call a hook and reset client side data when rendering inside the Page Designer
    if (PageRenderHelper.isInEditMode()) {
        var HookManager = require('dw/system/HookMgr');
        HookManager.callHook('app.experience.editmode', 'editmode');
        model.resetEditPDMode = true;
    }

    var expires = new Date();
    expires.setDate(expires.getDate() + 1); // this handles overflow automatically
    response.setExpires(expires);

    model.CurrentPageMetaData = PageRenderHelper.getPageMetaData(page);

    // render the page
    return new Template('experience/pages/threeRowStorePage').render(model).text;
};
