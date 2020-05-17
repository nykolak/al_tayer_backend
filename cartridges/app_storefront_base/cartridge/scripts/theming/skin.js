var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ContentMgr = require('dw/content/ContentMgr');

exports.renderSkin = function renderSkin() {
    var contentAsset = ContentMgr.getContent('store-skin');
    var renderParameters = new HashMap();
    if (contentAsset) {
        if (contentAsset.custom.customCSSFile) {
            renderParameters.type = 'FILE';
            renderParameters.url = contentAsset.custom.customCSSFile.getURL();
        } else {
            renderParameters.type = 'INLINE';
            renderParameters.markup = contentAsset.custom.body;
        }
        var template = new Template('components/skin');
        return template.render(renderParameters).text;
    }
    return '';
};
