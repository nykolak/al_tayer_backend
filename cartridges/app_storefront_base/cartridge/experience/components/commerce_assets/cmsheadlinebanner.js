'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('~/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for the assets.headlinebanner.
 */
module.exports.render = function(context) {
    var model = new HashMap();
    var content = context.content;

    if (content.cmsItem) {
        model.bannerTitle = content.cmsItem.attributes.title;
        model.bannerCopy = content.cmsItem.attributes.body;

        if (content.cmsItem.attributes.bannerImage) {
            model.bannerImg = {
                src: {
                    mobile: ImageTransformation.url(content.cmsItem.attributes.bannerImage, { device: 'mobile' }),
                    desktop: ImageTransformation.url(content.cmsItem.attributes.bannerImage, { device: 'desktop' })
                },
                alt: content.cmsItem.attributes.excerpt
            };
        }
    }

    model.callToAction = {
        title: content.ctaTitle,
        link: content.ctaLink
    }

    return new Template('experience/components/commerce_assets/headlinebanner').render(model).text;
};