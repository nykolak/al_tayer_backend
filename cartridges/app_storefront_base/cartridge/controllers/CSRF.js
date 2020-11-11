'use strict';

/**
 * @namespace CSRF
 */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * CSRF-Fail : The CSRF-Fail endpoint is responsible for rendering the CSRF token mismatch error page
 * @name Base/CSRF-Fail
 * @function
 * @memberof CSRF
 * @param {category} - non-sensitive
 * @param {serverfunction} - get
 */
server.get('Fail', function (req, res, next) {
    res.render('/csrfFail');
    next();
});

/**
 * CSRF-AjaxFail : The CSRF-AjaxFail endpoint is responsible for handling CSRF token mismatch in ajax requests
 * @name Base/CSRF-AjaxFail
 * @function
 * @memberof CSRF
 * @param {category} - non-sensitive
 * @param {serverfunction} - get
 */
server.get('AjaxFail', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.setStatusCode(500);
    res.json({ csrfError: true, redirectUrl: URLUtils.url('CSRF-Fail').toString() });
    next();
});

/**
 * CSRF-Generate : This endpoint generates a CSRF token... This is made for integration test purposes
 * @name Base/CSRF-Generate
 * @function
 * @memberof CSRF
 * @param {category} - non-sensitive
 * @param {serverfunction} - get
 */
server.post('Generate', csrfProtection.generateToken, function (req, res, next) {
    res.json();
    next();
});

module.exports = server.exports();
