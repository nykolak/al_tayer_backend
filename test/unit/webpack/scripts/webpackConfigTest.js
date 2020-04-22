/* eslint-disable array-callback-return */
'use strict';

var assert = require('chai').assert;
var WebpackConfig = require('../../../../webpack.config');
var path = require('path');
var sinon = require('sinon');

describe('getPlugins()', function () {
    it('should use TerserPlugin if development mode is not set', function () {
        var env = {};
        env.dev = false;
        var plugins = WebpackConfig.getPlugins('../does/not/exist', 'js', env);
        var hasTerserPlugin = false;
        plugins.map(function (plugin) {
            if (!hasTerserPlugin) {
                hasTerserPlugin = (plugin.constructor.name.toString() === 'TerserPlugin');
            }
        });
        assert.isTrue(hasTerserPlugin);
    });

    it('should use WebpackStyleLintPlugin for scss and linting enabled', function () {
        var env = {};
        env.useLinter = true;
        var pluginsWithLinter = WebpackConfig.getPlugins('../does/not/exist', 'scss', env);
        env.useLinter = false;
        var pluginsWithoutLinter = WebpackConfig.getPlugins('../does/not/exist', 'scss', env);
        // since the plugin does not expose its constructor name we hack it like that
        assert(pluginsWithLinter > pluginsWithoutLinter);
    });

    it('should always use WebpackCleanPlugin', function () {
        var env = {};
        env.dev = false;
        env.useLinter = false;
        var plugins = WebpackConfig.getPlugins('../does/not/exist', 'js', env);
        var hasCleanWebpackPlugin = false;
        plugins.map(function (plugin) {
            if (!hasCleanWebpackPlugin) {
                hasCleanWebpackPlugin = (plugin.constructor.name.toString() === 'CleanWebpackPlugin');
            }
        });
        assert.isTrue(hasCleanWebpackPlugin);
    });
});

describe('buildDynamicAliases()', function () {
    it('should use the same resolve aliases for scss and js', function () {
        var sfraBuilderConfig;
        try {
            sfraBuilderConfig = require('../../webpackHandling/sfraBuilderConfig');
        } catch (err) {
            // eslint-disable-next-line no-console
            console.log('sfraBuilderConfig not existant - exiting this test');
            assert.isTrue(true); // accept code coverage
            return;
        }
        var alias = sfraBuilderConfig.aliasConfig.alias;
        var jsAlias = WebpackConfig.buildDynamicAliases(alias, 'js');
        var scssAlias = WebpackConfig.buildDynamicAliases(alias, 'scss');
        assert.equal(Object.keys(jsAlias)[0], Object.keys(scssAlias)[0]);
    });
});

describe('scanEntryPoints()', function () {
    it('should return an entry point for JS and SCSS', function () {
        var jsEntryPoint = WebpackConfig.scanEntryPoints(path.resolve(__dirname, '../fixtures'), 'js');
        var scssEntryPoint = WebpackConfig.scanEntryPoints(path.resolve(__dirname, '../fixtures'), 'scss');
        var jsFile = Object.entries(jsEntryPoint)[0][1];
        var scssFile = Object.entries(scssEntryPoint)[0][1];
        var fixtureJSFile = 'default/js/test.js';
        var fixtureSCSSFile = 'default/scss/test.scss';
        assert(jsFile.includes(fixtureJSFile));
        assert(scssFile.includes(fixtureSCSSFile));
    });
});

describe('bundleCartridge()', function () {
    it('should have move production with env dev false', function () {
        var env = {};
        env.dev = false;
        env.useLinter = false;
        var bundledConfig = WebpackConfig.bundleCartridge(
            env,
            path.resolve(__dirname, '../fixtures'),
            'js');
        assert(bundledConfig.mode === 'production');
    });

    it('should have mode set to production and no source-maps on env.dev=false', function () {
        var env = {};
        env.dev = false;
        var bundledConfig = WebpackConfig.bundleCartridge(
            env,
            path.resolve(__dirname, '../fixtures'),
            'js');
        assert(bundledConfig.mode === 'production');
        assert(bundledConfig.devtool === undefined);
    });

    it('should have mode set to development and active source-maps on env.dev=true', function () {
        var env = {};
        env.dev = true;
        var bundledConfig = WebpackConfig.bundleCartridge(
            env,
            path.resolve(__dirname, '../fixtures'),
            'js');
        assert(bundledConfig.mode === 'development');
        assert(bundledConfig.devtool === 'source-map');
    });

    it('should return empty object on non-existings folders', function () {
        var env = {};
        env.dev = true;
        var bundledConfig = WebpackConfig.bundleCartridge(
            env,
            path.resolve(__dirname, '../doesNotEists'),
            'js');
        assert(Object.keys(bundledConfig).length === 0);
    });

    it('should call all needed methods', function () {
        var env = {};
        env.dev = false;
        var stubGetPlugins = sinon.stub(WebpackConfig, 'getPlugins');
        var stubBuildDynamicAliases = sinon.stub(WebpackConfig, 'buildDynamicAliases');
        var stubScanEntryPoints = sinon.stub(WebpackConfig, 'scanEntryPoints').returns({
            'default/js/test.js': path.resolve(__dirname, '../fixtures/cartridge/client/default/js/test.js')
        });
        WebpackConfig.bundleCartridge(env, path.resolve(__dirname, '../fixtures'), 'js');
        assert(stubScanEntryPoints.called);
        assert(stubGetPlugins.calledAfter(stubScanEntryPoints));
        assert(stubBuildDynamicAliases.calledAfter(stubGetPlugins));
    });

    it('should createOutputfiles for js/css', function () {
        var exec = require('child_process').exec;
        exec('npm run test:fixture', function (err) {
            var files;
            if (err) {
                // we have an error - fail the test
                assert.isTrue(false);
            }
            var fs = require('fs-extra');
            try {
                files = fs.readdirSync('./test/fixtures/cartridge/static/default');
                fs.removeSync('./test/fixtures/cartridge/static');
            } catch (err) {
                // eslint-disable-next-line no-console
                console.log(err);
                assert.isTrue(false);
            }
            // we expect to have js/css folder in output
            assert.isTrue(files.length === 2);
        });
    });
});
