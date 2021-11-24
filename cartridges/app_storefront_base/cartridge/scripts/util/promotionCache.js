/* globals session request */
'use strict';

var PromotionMgr = require('dw/campaign/PromotionMgr');
var collections = require('*/cartridge/scripts/util/collections');

var promotionCache = Object.create(null);

Object.defineProperty(promotionCache, 'promotions', {
    get: function () {
        var cacheKey = request.requestID.split('-')[0];
        if (session.privacy.promoCache) {
            var cacheObj = JSON.parse(session.privacy.promoCache);
            if (cacheKey === cacheObj.cacheKey) {
                return cacheObj.promoIds;
            }
        }
        var activePromotions = PromotionMgr.activeCustomerPromotions.getProductPromotions();
        var promoIds = collections.map(activePromotions, function (promo) {
            return promo.ID;
        });

        session.privacy.promoCache = JSON.stringify({
            cacheKey: cacheKey,
            promoIds: promoIds
        });
        return promoIds;
    }
});

module.exports = promotionCache;
