"use strict";

var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");

function getProductData() {
    return LocalServiceRegistry.createService('bm_al_tayer.http.get.demoReview', {
        createRequest: function (service, requestData) {
            service.setRequestMethod('GET');
            service.addParam('productID', requestData.productID);
        },
        parseResponse: function (service, response) {
            return JSON.parse(response.text);
        },
        mockCall: function (service, data) {
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify({
                    'averageRating': Math.random() * 5, //Generates a random number between 0 and 5
                    'reviewCount': Math.floor(Math.random() * 100) + 1 // Generates a random number between 1 and 100
                })
            };
        }
    });
}

module.exports = {
    getProductData: getProductData
};