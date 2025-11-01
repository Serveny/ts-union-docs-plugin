"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnionTypeDocsPlugin = void 0;
const docs_1 = require("./docs");
const info_1 = require("./info");
class UnionTypeDocsPlugin {
    constructor(ts) {
        this.ts = ts;
    }
    create(info) {
        this.logger = info.project.projectService.logger;
        this.ls = info.languageService;
        this.typeInfoFactory = new info_1.TypeInfoFactory(this.ts, this.ls);
        this.proxy = createLsProxy(this.ls);
        this.proxy.getQuickInfoAtPosition = this.getQuickInfoAtPosition.bind(this);
        this.proxy.getCompletionsAtPosition =
            this.getCompletionsAtPosition.bind(this);
        this.logger.info('[Union type docs plugin] Loaded');
        return this.proxy;
    }
    getQuickInfoAtPosition(fileName, pos) {
        const quickInfo = this.ls.getQuickInfoAtPosition(fileName, pos);
        if (!quickInfo)
            return quickInfo;
        const typeInfo = this.typeInfoFactory.create(fileName, pos);
        if (!typeInfo)
            return quickInfo;
        (0, docs_1.addExtraDocs)(this.ts, quickInfo, typeInfo);
        return quickInfo;
    }
    getCompletionsAtPosition(fileName, pos, opts, fmt) {
        const cmpl = this.ls.getCompletionsAtPosition(fileName, pos, opts, fmt);
        return cmpl;
    }
}
exports.UnionTypeDocsPlugin = UnionTypeDocsPlugin;
// Create new object with all functions of the old language service
function createLsProxy(oldLs) {
    const proxy = Object.create(null);
    for (const k of Object.keys(oldLs)) {
        const x = oldLs[k];
        proxy[k] = typeof x === 'function' ? x.bind(oldLs) : x;
    }
    return proxy;
}
//# sourceMappingURL=plugin.js.map