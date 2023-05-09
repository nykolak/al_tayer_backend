"use strict";

var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry");

function reduceStock() {
    return LocalServiceRegistry.createService('bm_al_tayer.http.post.demoInventory', {
        createRequest: function (service, requestData) {
            service.setRequestMethod('POST');
            return requestData;
        },
        parseResponse: function (service, response) {
            return JSON.parse(response.text);
        },
        mockCall: function (service, data) {
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify({
                    'success': true
                })
            };
        }
    });
}

module.exports = {
    reduceStock: reduceStock
};