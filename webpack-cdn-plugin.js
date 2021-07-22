const path = require('path');
const ExternalModule = require('webpack/lib/ExternalModule');
const HtmlWebpackPlugin = require('html-webpack-plugin');

class WebpackExternalCDNPlugin {
    dev = true;
    moduleRegex = /^((?:@[a-z0-9][\w-.]+\/)?[a-z0-9][\w-.]*)/;
    paramsRegex = /:([a-z]+)/gi;
    modulesFromCdn = {};
    loadedModulesFromCdn = {};

    constructor({ dev = true, modules = [] }) {
        this.dev = dev;
        modules.forEach(module => {
            this.modulesFromCdn[module.name] = module;
        });
    }

    getVersionInNodeModules(name, pathToNodeModules = process.cwd()) {
        try {
            return require(path.join(pathToNodeModules, 'node_modules', name, 'package.json')).version;
        } catch (e) {
            /* istanbul ignore next */
            return null;
        }
    }

    getModuleVar(modulePath) {
        const module = this.modulesFromCdn[modulePath];
        if (!module) return false;

        const { devUrl, prodUrl } = module || {};

        if (this.dev) {
            if (!devUrl) return false;
        } else {
            if (!prodUrl) return false;
        }

        this.loadedModulesFromCdn[modulePath] = {};
        return module.var;
    }

    apply(compiler) {
        compiler.hooks.normalModuleFactory.tap('WebpackExternalCDNPlugin', (normalModuleFactory) => {
            normalModuleFactory.hooks.factorize.tap('WebpackExternalCDNPlugin', (data) => {
                const modulePath = data.dependencies[0].request;
                const contextPath = data.context;

                const isModulePath = this.moduleRegex.test(modulePath);
                if (!isModulePath) return;

                const varName = this.getModuleVar(modulePath);
                if (!varName) return;

                if (varName === false) {
                    return data;
                } else {
                    return new ExternalModule(varName, 'var', modulePath);
                }
            });
        });

        compiler.hooks.compilation.tap('WebpackExternalCDNPlugin', (compilation) => {
            HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
                'WebpackExternalCDNPlugin', (data, callback) => {
                    Object.keys(this.loadedModulesFromCdn).forEach(module => {
                        const { devUrl, prodUrl } = this.modulesFromCdn[module];
                        var url = (this.dev ? devUrl : prodUrl) || '';
                        const version = this.getVersionInNodeModules(module);

                        url = url.replace(this.paramsRegex, (m, p1) => {
                            if (p1 === 'name') return module;
                            if (p1 === 'version') return version;
                            return p1;
                        });

                        data.bodyTags = [...data.bodyTags, new HtmlWebpackPlugin.createHtmlTagObject('script', { src: url })];
                    });

                    callback(null, data);
                });
        });
    }
}

module.exports = WebpackExternalCDNPlugin;