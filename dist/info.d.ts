import type * as TS from 'typescript/lib/tsserverlibrary';
export declare enum SupportedType {
    Paramter = 0,
    Variable = 1
}
export declare class UnionInfo {
    type: SupportedType;
    name: string;
    initNode: CalledNode;
    entries: CalledNode[];
    value?: string | undefined;
    docComment?: string[] | undefined;
    constructor(type: SupportedType, name: string, initNode: CalledNode, entries: CalledNode[], value?: string | undefined, docComment?: string[] | undefined);
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
    constructor(ts: typeof TS, ls: TS.LanguageService);
    getTypeInfo(fileName: string, position: number): UnionInfo[] | null;
    getContextualTypeInfo(fileName: string, position: number): UnionInfo | null;
    private resolveTypeNode;
    private getTypeNodeFromAlias;
    private getTypeNodeFromParameter;
    private getTypeNodeFromInitializer;
    private filterRegexMembers;
    private findCallLikeExpression;
    private getUnionInfo;
    private getUnionVariableInfo;
    private getInitNode;
    private findNodeAtPos;
    private getCallExpression;
    private getUnionParamtersInfo;
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
}
export declare function isRegexNode(node: CalledNode): node is TS.StringLiteral & CalledNode;
