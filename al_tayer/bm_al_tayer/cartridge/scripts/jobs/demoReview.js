"use strict";

function execute(args) {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Transaction = require('dw/system/Transaction');
    var DemoReviewService = require('*/cartridge/scripts/services/demoReview');

    if (!args.Enabled) {
        return new Status(Status.OK, '', 'Step disabled, skipping it.');
    }

    var demoMode = args.DemoMode;
    var counter = 0;
    var hasError = false;
    // If multiple sites offer the same product, this can be changed to queryProductsInCatalog() to avoid the same product being updated multiple times.
    // Also, depending on the client's needs and the thirty party used for ratings and reviews, ratings and reviews may be aggregated on the master product. 
    // If so, this logic can be updated to ignore variants/variation groups. 
    var allProducts = ProductMgr.queryAllSiteProducts();

    while (allProducts.hasNext() && counter < 10) {
        var product = allProducts.next();
        var serviceResponse = DemoReviewService.getProductData().call({ 'productID': product.ID });
        if (serviceResponse.ok) {
            var reviewCount = serviceResponse.object.reviewCount;
            var averageRating = serviceResponse.object.averageRating

            // This assumes that markets/locales share the same ratings and reviews. If that's not the case, this can be updated to use localized fields.
            Transaction.begin();
            product.custom.reviewCount = reviewCount;
            product.custom.averageRating = averageRating;
            Transaction.commit();
        } else {
            hasError = true;
        }

        if (demoMode) {
            Logger.info('\nProduct with ID: {0} updates with {1} as a review count and {2} as a average rating', product.ID, reviewCount, averageRating);
            counter++;
        }
    }

    return hasError ? new Status(Status.ERROR, '', 'Step completed with errors') : new Status(Status.OK, '', 'Step completed without errors');
}

module.exports = {
    execute: execute
};