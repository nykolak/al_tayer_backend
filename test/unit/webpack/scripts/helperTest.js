/* eslint-disable array-callback-return */
'use strict';

var assert = require('chai').assert;
var WebpackHelper = require('../../../../webpackHandling/helper');
var path = require('path');

describe('buildRuleSet()', function () {
    it('should use eslint when linter is set to true', function () {
        var env = {};
        env.useLinter = true;
        var rules = WebpackHelper.buildRuleSet(__dirname, path.resolve(__dirname, './fixtures'), env, 'js');
        var hasLinter = false;
        rules.map(function (rule) {
            if (Array.isArray(rule.use) && !hasLinter) {
                hasLinter = (rule.use.indexOf('eslint-loader') !== -1);
            }
        });
        assert.isTrue(hasLinter);
    });

    it('should not use eslint when linter is set to true', function () {
        var env = {};
        env.useLinter = false;
        var rules = WebpackHelper.buildRuleSet(__dirname, path.resolve(__dirname, './fixtures'), env, 'js');
        var hasLinter = false;
        rules.map(function (rule) {
            if (Array.isArray(rule.use) && !hasLinter) {
                hasLinter = (rule.use.indexOf('eslint-loader') !== -1);
            }
        });
        assert.isFalse(hasLinter);
    });

    it('should not use eslint when linter is set to true', function () {
        var env = {};
        env.useLinter = false;
        var rules = WebpackHelper.buildRuleSet(__dirname, path.resolve(__dirname, './fixtures'), env, 'js');
        var hasLinter = false;
        rules.map(function (rule) {
            if (Array.isArray(rule.use) && !hasLinter) {
                hasLinter = (rule.use.indexOf('eslint-loader') !== -1);
            }
        });
        assert.isFalse(hasLinter);
    });

    it('scss should have source-maps if env is set to dev', function () {
        var env = {};
        env.dev = true;
        var rules = WebpackHelper.buildRuleSet(__dirname, path.resolve(__dirname, './fixtures'), env, 'scss');
        var hasSourceMaps = true;
        rules.map(function (rule) {
            rule.loader.map(function (taskRunner) {
                if (taskRunner.options.sourceMap === false) {
                    hasSourceMaps = false;
                }
            });
        });
        assert.isTrue(hasSourceMaps);
    });

    it('should include all relevant paths for node_modules', function () {
        var sfraBuilderConfig;
        try {
            sfraBuilderConfig = require('../../webpackHandling/sfraBuilderConfig');
        } catch (err) {
            // eslint-disable-next-line no-console
            console.log('sfraBuilderConfig not existant - exiting this test');
            assert.isTrue(true); // accept code coverage
            return;
        }
        var env = {};
        env.useLinter = false;
        var rules = WebpackHelper.buildRuleSet(__dirname, path.resolve(__dirname, './fixtures'), env, 'scss');
        var availableTaskRunners = [];
        var expectedIncludePaths = [];
        rules.map(function (rule) {
            rule.loader.map(function (taskRunner) {
                availableTaskRunners.push(taskRunner.loader);
                if (taskRunner.options.includePaths) {
                    expectedIncludePaths = taskRunner.options.includePaths;
                }
            });
        });
        // each cartridge needs to include node_modules & node_modules/flag-icon-css/sass
        // externalPaths == sfraBuilderConfig.cartridges.length * 2
        // current path also includes node_modules & node_modules/flag-icon-css/sass
        // allPaths = externalPaths + 2
        var includePathsToCheck = (sfraBuilderConfig.cartridges.length * 2) + 2;
        assert.strictEqual(includePathsToCheck, expectedIncludePaths.length);
        assert.isTrue(availableTaskRunners.indexOf('css-loader') !== -1);
        assert.isTrue(availableTaskRunners.indexOf('postcss-loader') !== -1);
        assert.isTrue(availableTaskRunners.indexOf('sass-loader') !== -1);
    });
});
