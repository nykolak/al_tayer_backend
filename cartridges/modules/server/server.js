/* globals request:false, response:false, customer:false, session:false */

'use strict';

var middleware = require('./middleware');
var Request = require('./request');
var Response = require('./response');
var Route = require('./route');
var render = require('./render');

var rq =
    new Request(typeof request !== 'undefined' ? request : {},
    typeof customer !== 'undefined' ? customer : {},
    typeof session !== 'undefined' ? session : {}
    );
var rs = new Response(typeof response !== 'undefined' ? response : {});
var actualEndpoint = request.httpURL.toString().split('?')[0].split('-').pop();

/**
 * @param {Object} req - Request object
 * @returns {Object} object containing the querystring of the loaded page
 */
function getPageMetadata(req) {
    var pageMetadata = {};
    var action = req.path.split('/');

    pageMetadata.action = action[action.length - 1];
    pageMetadata.queryString = req.querystring.toString();
    pageMetadata.locale = req.locale.id;

    return pageMetadata;
}
rs.setViewData(getPageMetadata(rq));

function onRouteCompleteHandler(req, res) {
    // compute cache value and set on response when we have a non-zero number
    if (res.cachePeriod && typeof res.cachePeriod === 'number') {
        var currentTime = new Date(Date.now());
        if (res.cachePeriodUnit && res.cachePeriodUnit === 'minutes') {
            currentTime.setMinutes(currentTime.getMinutes() + res.cachePeriod);
        } else {
            // default to hours
            currentTime.setHours(currentTime.getHours() + res.cachePeriod);
        }
        res.base.setExpires(currentTime);
    }
    // add vary by
    if (res.personalized) {
        res.base.setVaryBy('price_promotion');
    }

    if (res.redirectUrl) {
        // if there's a pending redirect, break the chain
        route.emit('route:Redirect', req, res);
        res.base.redirect(res.redirectUrl);
        return;
    }

    if (res.view && res.viewData) {
        render.template(res.view, res.viewData, res);
    } else if (res.isJson) {
        render.json(res.viewData, res);
    } else if (res.isXml) {
        render.xml(res.viewData, res);
    } else {
        throw new Error('Cannot render template without name or data');
    }
}


//--------------------------------------------------
// Public Interface
//--------------------------------------------------

/**
 * @constructor
 * @classdesc Server is a routing solution
 */
function Server() {
    this.routes = {};
}

Server.prototype = {
    /**
     * Creates a new route with a name and a list of middleware
     * @param {string} name - Name of the route
     * @param {Function[]} arguments - List of functions to be executed
     * @returns {void}
     */
    use: function use(name) {
        var args = Array.prototype.slice.call(arguments);
        var middlewareChain = args.slice(1);

        if (this.routes[name]) {
            throw new Error('Route with this name already exists');
        }

        var route = new Route(name, middlewareChain, rq, rs);
        // Add event handler for rendering out view on completion of the request chain
        route.on('route:Complete', onRouteCompleteHandler);

        this.routes[name] = route;

        return route;
    },
    /**
     * Shortcut to "use" method that adds a check for get request
     * @param {string} name - Name of the route
     * @param {Function[]} arguments - List of functions to be executed
     * @returns {void}
     */
    get: function get() {
        if (actualEndpoint !== arguments[0]) {
            return;
        }

        var args = Array.prototype.slice.call(arguments);
        args.splice(1, 0, middleware.get);

        return this.use.apply(this, args);
    },
    /**
     * Shortcut to "use" method that adds a check for post request
     * @param {string} name - Name of the route
     * @param {Function[]} arguments - List of functions to be executed
     * @returns {void}
     */
    post: function post() {
        if (actualEndpoint !== arguments[0]) {
            return;
        }

        var args = Array.prototype.slice.call(arguments);
        args.splice(1, 0, middleware.post);
        return this.use.apply(this, args);
    },
    /**
     * Output an object with all of the registered routes
     * @returns {Object} Object with properties that match registered routes
     */
    exports: function exports() {
        var exportStatement = {};
        Object.keys(this.routes).forEach(function (key) {
            exportStatement[key] = this.routes[key].getRoute();
            exportStatement[key].public = true;
        }, this);
        if (!exportStatement.__routes) {
            exportStatement.__routes = this.routes;
        }
        return exportStatement;
    },
    /**
     * Extend existing server object with a list of registered routes
     * @param {Object} server - Object that corresponds to the output of "exports" function
     * @returns {void}
     */
    extend: function (server) {
        var newRoutes = {};
        if (!server.__routes) {
            throw new Error('Cannot extend non-valid server object');
        }
        if (Object.keys(server.__routes).length === 0) {
            throw new Error('Cannot extend server without routes');
        }

        Object.keys(server.__routes).forEach(function (key) {
            newRoutes[key] = server.__routes[key];
        });

        this.routes = newRoutes;
    },
    /**
     * Modify a given route by prepending additional middleware to it
     * @param {string} name - Name of the route to modify
     * @param {Function[]} arguments - List of functions to be appended
     * @returns {void}
     */
    prepend: function prepend(name) {
        var args = Array.prototype.slice.call(arguments);
        var middlewareChain = Array.prototype.slice.call(arguments, 1);

        checkParams(args);

        if (!this.routes[name]) {
            throw new Error('Route with this name does not exist');
        }

        this.routes[name].chain = middlewareChain.concat(this.routes[name].chain);
    }, /**
    * Modify a given route by appending additional middleware to it
    * @param {string} name - Name of the route to modify
    * @param {Function[]} arguments - List of functions to be appended
    * @returns {void}
    */
    append: function append(name) {
        var args = Array.prototype.slice.call(arguments);
        var middlewareChain = Array.prototype.slice.call(arguments, 1);

        checkParams(args);

        if (!this.routes[name]) {
            throw new Error('Route with this name does not exist');
        }

        this.routes[name].chain = this.routes[name].chain.concat(middlewareChain);
    },

    /**
     * Replace a given route with the new one
     * @param {string} name - Name of the route to replace
     * @param {Function[]} arguments - List of functions for the route
     * @returns {void}
     */
    replace: function replace(name) {
        var args = Array.prototype.slice.call(arguments);

        checkParams(args);

        if (!this.routes[name]) {
            throw new Error('Route with this name does not exist');
        }

        delete this.routes[name];

        this.use.apply(this, arguments);
    },

    /**
     * Returns a given route from the server
     * @param {string} name - Name of the route
     * @returns {Object} Route that matches the name that was passed in
     */
    getRoute: function getRoute(name) {
        return this.routes[name];
    }
};

module.exports = new Server();
