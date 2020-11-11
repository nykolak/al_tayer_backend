'use strict';

/**
 * @namespace ConsentTracking
 */

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * ConsentTracking-SetSession : This endpoint is called when the shopper agrees/disagrees to tracking consent
 * @name Base/ConsentTracking-SetSession
 * @function
 * @memberof ConsentTracking-SetSession
 * @param {querystringparameter} - consent -  The value of this is a boolean. If the boolean value is true, tracking is enabled for the current session; if false, tracking is disabled
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.get('SetSession', function (req, res, next) {
    var consent = (req.querystring.consent === 'true');
    req.session.raw.setTrackingAllowed(consent);
    req.session.privacyCache.set('consent', consent);
    res.json({ success: true });
    next();
});

/**
 * 
 */
server.get('GetContent', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');

    var apiContent = ContentMgr.getContent(req.querystring.cid);

    if (apiContent) {
        var content = new ContentModel(apiContent, 'components/content/contentAssetInc');
        if (content.template) {
            res.render(content.template, { content: content });
        }
    }
    next();
});

server.get('Check', consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var content = ContentMgr.getContent('tracking_hint');
    res.render('/common/consent', {
        consentApi: Object.prototype.hasOwnProperty.call(req.session.raw, 'setTrackingAllowed'),
        caOnline: content.online
    });
    next();
});

module.exports = server.exports();
