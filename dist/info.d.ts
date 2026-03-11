import type * as TS from 'typescript/lib/tsserverlibrary';
export declare enum SupportedType {
    Parameter = 0,
    Variable = 1
}
export declare class UnionInfo {
    type: SupportedType;
    name: string;
    initNode: CalledNode;
    entries: CalledNode[];
    value?: string | undefined;
    docComment?: string[] | undefined;
    tags?: TS.JSDocTagInfo[] | undefined;
    constructor(type: SupportedType, name: string, initNode: CalledNode, entries: CalledNode[], value?: string | undefined, docComment?: string[] | undefined, tags?: TS.JSDocTagInfo[] | undefined);
}
export interface CompletionContextInfo {
    initNode: TS.Expression;
    templateInfo: UnionInfo | null;
    entryInfos: UnionInfo[];
}
export interface DeprecatedUsageInfo {
    node: TS.Expression;
    info: UnionInfo;
}
export interface CalledNode extends TS.Node {
    id?: number;
    callParent?: CalledNode;
    original?: TS.Node;
    isRegexPattern?: boolean;
    codeText?: string;
}
export declare class TypeInfoFactory {
    private ts;
    private ls;
    private checker;
    private currentProgram;
    private sourceFileCache;
    private typeInfoCache;
    private completionInfoCache;
    private deprecatedUsageCache;
    constructor(ts: typeof TS, ls: TS.LanguageService);
    getTypeInfo(fileName: string, position: number): UnionInfo[] | null;
    getCompletionInfo(fileName: string, position: number): CompletionContextInfo | null;
    getCompletionEntryInfo(fileName: string, position: number, entryName: string): UnionInfo | null;
    getDeprecatedUsageInfos(fileName: string): DeprecatedUsageInfo[];
    private getTypeInfoForNode;
    private getTypeInfoForExpression;
    private getUnionInfoForArgument;
    private getCompletionContext;
    private resolveTypeNode;
    private getTypeNodeFromAlias;
    private getTypeNodeFromParameter;
    private getTypeNodeFromInitializer;
    private filterRegexMembers;
    private findCallLikeExpression;
    private getUnionExpressionInfo;
    private getExpressionName;
    private getUnionInfo;
    private getUnionVariableInfo;
    private createCompletionEntryInfos;
    private createUnionInfo;
    private collectDocMetadata;
    private getInitNode;
    private getSourceFile;
    private getProgram;
    private clearCaches;
    private findNodeAtPos;
    private getCallExpression;
    private getUnionParametersInfo;
    private getValue;
    private collectUnionMemberNodes;
    private collectConditionalTypeNode;
    private collectIndexedAccessTypeNode;
    private collectTypeLiteralNode;
    private collectMappedTypeNode;
    private collectTypeReferenceNode;
    private collectKeyOfKeywordTypeOperatorNode;
    private collectTupleTypeNode;
    private collectTypeQueryNode;
    private createLiteralNode;
    private buildTemplateLiteralNode;
    private buildTypeArgumentMap;
    private cmp;
    private cmpLit;
    private resolveExpression;
    private unwrapExpression;
    private getReferencedSymbol;
    private getConstInitializer;
    private getCompletionEntryName;
}
export declare function getDeprecatedTag(tags: readonly TS.JSDocTagInfo[] | undefined): TS.JSDocTagInfo | undefined;
export declare function getTagText(tag: TS.JSDocTagInfo | undefined): string;
export declare function isRegexNode(node: CalledNode): node is TS.StringLiteral & CalledNode;
