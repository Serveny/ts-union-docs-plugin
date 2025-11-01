import type * as TS from 'typescript/lib/tsserverlibrary';
export declare class UnionTypeDocsPlugin {
    private readonly ts;
    private logger;
    private ls;
    private proxy;
    private typeInfoFactory;
    constructor(ts: typeof TS);
    create(info: TS.server.PluginCreateInfo): TS.LanguageService;
    private getQuickInfoAtPosition;
    private getCompletionsAtPosition;
}
