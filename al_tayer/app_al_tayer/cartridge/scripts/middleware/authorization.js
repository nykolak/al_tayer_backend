'use strict';

/**
 * Middleware validating Basic Auth
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void|Redirect}
 */
function ensureBasicAuth(req, res, next) {
    var Site = require('dw/system/Site');
    var StringUtils = require('dw/util/StringUtils');

    var baUser = Site.getCurrent().getCustomPreferenceValue('clientUsername');
    var baPassword = Site.getCurrent().getCustomPreferenceValue('clientPassword');
    var baHeader = request.httpHeaders.authorization;
    var basicPrefix = 'Basic';

    if (baUser && baPassword && baHeader && baHeader.indexOf(basicPrefix) === 0) {
        // Authorization: Basic base64credentials
        var base64Credentials = baHeader.substring(basicPrefix.length).trim();
        var credentials = StringUtils.decodeBase64(base64Credentials); // credentials = username:password

        var values = credentials.split(':', 2);
        if (values[0] === baUser && values[1] === baPassword) {
            return next();
        }
    }

    res.json({
        'error': true,
        'errorMessage': 'You are not authorized to perform this operation'
    });
    res.setStatusCode(403);
    this.emit('route:Complete', req, res);
}

module.exports = {
    ensureBasicAuth: ensureBasicAuth
};
