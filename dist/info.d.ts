import type * as TS from 'typescript/lib/tsserverlibrary';
export declare class TypeInfo {
    unionParams: UnionParameterInfo[];
    constructor(unionParams: UnionParameterInfo[]);
}
export declare class UnionParameterInfo {
    i: number;
    name: string;
    entries: TS.TypeNode[];
    value?: string | undefined;
    docComment?: string[] | undefined;
    constructor(i: number, name: string, entries: TS.TypeNode[], value?: string | undefined, docComment?: string[] | undefined);
}
export declare class TypeInfoFactory {
    private ts;
    private ls;
    private checker;
    constructor(ts: typeof TS, ls: TS.LanguageService);
    create(fileName: string, position: number): TypeInfo | null;
    private findNodeAtPos;
    private getCallExpression;
    private getUnionParamters;
    private getUnionParamInfo;
    private getValue;
    private collectUnionMemberNodes;
    private cmp;
}
