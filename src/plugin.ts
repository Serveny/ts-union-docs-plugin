import type * as ts from 'typescript/lib/tsserverlibrary';
import { addExtraDocsToQuickInfo, extractJsDoc } from './docs';

export class UnionTypeDocsPlugin {
  private logger!: ts.server.Logger;
  private ls!: ts.LanguageService;
  private proxy!: ts.LanguageService;

  constructor(private readonly typescript: typeof ts) {}

  create(info: ts.server.PluginCreateInfo) {
    this.logger = info.project.projectService.logger;
    this.ls = info.languageService;
    this.proxy = this.createLsProxy(this.ls);
    this.proxy.getQuickInfoAtPosition = this.getQuickInfoAtPosition.bind(this);
    this.logger.info('[Union type docs plugin] Loaded');
    return this.proxy;
  }

  private createLsProxy(oldLs: ts.LanguageService): ts.LanguageService {
    const proxy = Object.create(null) as ts.LanguageService;
    for (const k of Object.keys(oldLs) as Array<keyof ts.LanguageService>) {
      const x = oldLs[k];
      (proxy as any)[k] = typeof x === 'function' ? x.bind(oldLs) : x;
    }
    return proxy;
  }

  private getQuickInfoAtPosition(fileName: string, position: number) {
    console.log('GETQUICKINFO:', fileName, position);
    const quickInfo = this.ls.getQuickInfoAtPosition(fileName, position);
    if (!quickInfo) return quickInfo;

    const program = this.ls.getProgram();
    if (!program) return quickInfo;

    const source = program.getSourceFile(fileName);
    if (!source) return quickInfo;

    const checker = program.getTypeChecker();
    const node = this.findNodeAtPosition(source, position);
    if (!node) return quickInfo;

    let callExpression = node;
    while (
      callExpression &&
      !this.typescript.isCallExpression(callExpression)
    ) {
      callExpression = callExpression.parent;
    }
    if (!callExpression || !this.typescript.isCallExpression(callExpression))
      return quickInfo;
    const signature = checker.getResolvedSignature(callExpression);
    if (!signature) {
      return quickInfo;
    }

    const declaration = signature.getDeclaration();
    if (
      !declaration ||
      !this.typescript.isCallSignatureDeclaration(declaration)
    ) {
      return quickInfo;
    }

    for (const param of declaration.parameters) {
      if (!param.type) {
        continue; // param has no type annotation
      }
      let unionNode: ts.UnionTypeNode | undefined = undefined;
      const typeNode = param.type;

      // is direct union type?
      if (this.typescript.isUnionTypeNode(typeNode)) {
        unionNode = typeNode;
        console.log('DIRECT: ', unionNode.pos, unionNode.end);
      }

      // is type alias?
      else if (this.typescript.isTypeReferenceNode(typeNode)) {
        const symbol = checker.getSymbolAtLocation(typeNode.typeName);
        console.log('symbol: ', symbol?.escapedName);
        if (symbol && symbol.declarations && symbol.declarations.length > 0) {
          const typeAliasDecl = symbol.declarations[0];
          if (
            this.typescript.isTypeAliasDeclaration(typeAliasDecl) &&
            this.typescript.isUnionTypeNode(typeAliasDecl.type)
          ) {
            unionNode = typeAliasDecl.type;
            console.log('ALIAS: ', unionNode.pos, unionNode.end);
          }
        }
      }

      if (!unionNode) {
        continue; // parameter is no union type
      }

      const extraDocs = extractJsDoc(unionNode);
      if (extraDocs.length > 0) addExtraDocsToQuickInfo(extraDocs, quickInfo);
    }
  }

  private findNodeAtPosition(
    sourceFile: ts.SourceFile,
    position: number
  ): ts.Node | undefined {
    const ts = this.typescript;
    function find(node: ts.Node): ts.Node | undefined {
      if (position >= node.getStart() && position < node.getEnd()) {
        return ts.forEachChild(node, find) || node;
      }
      return undefined;
    }
    return find(sourceFile);
  }
}
