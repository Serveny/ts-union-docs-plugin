import type * as TS from 'typescript/lib/tsserverlibrary';
export declare class UnionTypeDocsPlugin {
    private readonly ts;
    constructor(ts: typeof TS);
    create(info: TS.server.PluginCreateInfo): TS.LanguageService;
}
