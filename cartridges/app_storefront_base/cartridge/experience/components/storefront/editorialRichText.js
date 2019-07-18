'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the storefront.editorialRichText component
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @returns {string} template to be displayed
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;

    model.bootstrapAlign = content.bootstrapAlign;

    if (content.richText) {
        model.richText = content.richText;
    }

    return new Template('experience/components/storefront/editorialRichText').render(model).text;
};
