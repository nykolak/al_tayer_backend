var Logger = require('dw/system/Logger');
var System = require('dw/system/System');
var StringUtils = require('dw/util/StringUtils');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var DATA_LAYER = 'data';
var SHOP_LAYER = 'shop';
var DEFAULT_VERSION = 'v23_2';

var authenticate = function () {
    var service = LocalServiceRegistry.createService('OCAPIAuth', {
        createRequest: function (svc) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            return 'grant_type=client_credentials';
        },
        parseResponse: function (svc, res) {
            return JSON.parse(res.text);
        }
    });
    var result = service.call();
    if (result.ok && result.object && result.object.access_token) {
        return result.object.access_token;
    }
    Logger.error('Error occur while fetching OCAPI Bearer token. Error: ' + result.errorMessage);
    return null;
};

var send = function (params) {
    var service = LocalServiceRegistry.createService('OCAPISend', {
        createRequest: function (svc, params) {
            var layer = params.layer;
            var version = params.version || DEFAULT_VERSION;
            var queryPath = params.path;
            var site = params.site || null;
            var path = StringUtils.format(
                '-/dw/{0}/{1}/{2}',
                DATA_LAYER,
                version,
                queryPath
            );

            if (layer === SHOP_LAYER) {
                path = StringUtils.format(
                    '{0}/dw/{1}/{2}/{3}',
                    site,
                    SHOP_LAYER,
                    version,
                    queryPath
                );
            }

            svc.setURL(StringUtils.format(svc.getURL(), path));
            // add token to each request
            var bearer = StringUtils.format('Bearer {0}', authenticate());
            svc.addHeader('Authorization', bearer);
            // ensure content-type
            svc.addHeader('Content-Type', 'application/json');
            // set request method
            if (params.hasOwnProperty('method')) {
                svc.setRequestMethod(params.method);
            }
            // add url parameters
            if (params.hasOwnProperty('parameters')) {
                Object.keys(params.parameters).forEach(function (key) {
                    svc.addParam(key, params.parameters[key]);
                });
            }
            // set all headers
            if (params.hasOwnProperty('headers')) {
                Object.keys(params.headers).forEach(function (key) {
                    svc.addHeader(key, params.headers[key]);
                });
            }
            // send stringifed body
            if (params.hasOwnProperty('body')) {
                return JSON.stringify(params.body);
            }
        },
        parseResponse: function (svc, res) {
            return JSON.parse(res.text);
        }
    });
    return service.call(params);
};

module.exports = {
    authenticate: authenticate,
    send: send,
    DEFAULT_VERSION: DEFAULT_VERSION,
    DATA_LAYER: DATA_LAYER,
    SHOP_LAYER: SHOP_LAYER
};
