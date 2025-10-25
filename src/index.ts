import * as ts from 'typescript/lib/tsserverlibrary';

function extractJsDoc(unionNode: ts.UnionTypeNode): string[] {
  console.log('EXTRACT JS DOC: ', unionNode.pos);
  const extraDocs: string[] = [];
  for (const memberNode of unionNode.types) {
    console.log('JS DOC Pos: ', memberNode.pos, memberNode.end);
    if (
      ts.isLiteralTypeNode(memberNode) &&
      memberNode.literal.kind === ts.SyntaxKind.StringLiteral
    ) {
      const literalNode = memberNode;
      const stringLiteral = (literalNode.literal as ts.StringLiteral).text;

      const jsDoc = (literalNode as any).jsDoc;

      if (jsDoc && jsDoc.length > 0) {
        // Nimm den letzten JSDoc-Block
        const lastJsDoc = jsDoc[jsDoc.length - 1];
        let comment = lastJsDoc.comment;

        // 'comment' kann ein String oder ein NodeArray sein
        let docString = '';
        if (typeof comment === 'string') {
          docString = comment;
        } else if (comment) {
          docString = (comment as ts.NodeArray<ts.JSDocComment>)
            .map((part) => part.text)
            .join('');
        }

        if (docString) {
          extraDocs.push(`- \`${stringLiteral}\`: ${docString.trim()}`);
        }
      }
    }
  }
  return extraDocs;
}

function addExtraDocsToQuickInfo(extraDocs: string[], quickInfo: ts.QuickInfo) {
  if (!quickInfo.documentation) {
    quickInfo.documentation = [];
  }

  quickInfo.documentation.push(
    { kind: 'lineBreak', text: '\n' },
    { kind: 'lineBreak', text: '\n' },
    { kind: 'text', text: 'Available Values:' },
    { kind: 'lineBreak', text: '\n' }
  );

  // Jeden Doc-String als eigenen Teil hinzufügen
  extraDocs.forEach((doc, index) => {
    quickInfo.documentation!.push({ kind: 'text', text: doc });
    if (index < extraDocs.length - 1) {
      quickInfo.documentation!.push({ kind: 'lineBreak', text: '\n' });
    }
  });
}

function init(modules: { typescript: any }) {
  const tsModule: typeof ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    console.log('XXXX---LOADING---XXXX');
    const logger = info.project.projectService.logger;
    const oldLS = info.languageService;

    const proxy = Object.create(null) as ts.LanguageService;
    for (const k of Object.keys(oldLS) as Array<keyof ts.LanguageService>) {
      const x = oldLS[k];
      (proxy as any)[k] = typeof x === 'function' ? x.bind(oldLS) : x;
    }

    proxy.getQuickInfoAtPosition = (fileName, position) => {
      console.log('GETQUICKINFO:', fileName, position);
      const quickInfo = oldLS.getQuickInfoAtPosition(fileName, position);
      if (!quickInfo) return quickInfo;

      const program = oldLS.getProgram();
      if (!program) return quickInfo;

      const source = program.getSourceFile(fileName);
      if (!source) return quickInfo;

      const checker = program.getTypeChecker();
      const node = findNodeAtPosition(source, position);
      if (!node) return quickInfo;

      let callExpression = node;
      while (callExpression && !ts.isCallExpression(callExpression)) {
        callExpression = callExpression.parent;
      }
      if (!callExpression || !ts.isCallExpression(callExpression))
        return quickInfo;
      const signature = checker.getResolvedSignature(callExpression);
      if (!signature) {
        return quickInfo;
      }

      const declaration = signature.getDeclaration();
      if (!declaration || !ts.isCallSignatureDeclaration(declaration)) {
        return quickInfo;
      }

      for (const param of declaration.parameters) {
        if (!param.type) {
          continue; // param has no type annotation
        }
        let unionNode: ts.UnionTypeNode | undefined = undefined;
        const typeNode = param.type;

        // is direct union type?
        if (ts.isUnionTypeNode(typeNode)) {
          unionNode = typeNode;
          console.log('DIRECT: ', unionNode.pos, unionNode.end);
        }

        // is type alias?
        else if (ts.isTypeReferenceNode(typeNode)) {
          const symbol = checker.getSymbolAtLocation(typeNode.typeName);
          console.log('symbol: ', symbol?.escapedName);
          if (symbol && symbol.declarations && symbol.declarations.length > 0) {
            const typeAliasDecl = symbol.declarations[0];
            if (
              ts.isTypeAliasDeclaration(typeAliasDecl) &&
              ts.isUnionTypeNode(typeAliasDecl.type)
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

      //const type = checker.getTypeAtLocation(node);
      //if (type.isUnion()) {
      //const parts = type.types.map((t) => {
      //const symbol = t.getSymbol();
      //if (!symbol) return null;
      //const comments = tsModule.displayPartsToString(
      //symbol.getDocumentationComment(checker)
      //);
      //const name = checker.typeToString(t);
      //return comments ? `${name}: ${comments}` : name;
      //});
      //logger.info('PARTS: ' + parts.toString());
      ////.filter(Boolean);

      //if (parts.length) {
      //infoAtPos.displayParts = [
      //{ text: `Union Members:\n${parts.join('\n')}`, kind: 'text' },
      //];
      //}
      //}

      console.log('XXXX---END---XXXX');
      logger.info('infoAtPos tags: ' + quickInfo.tags);
      logger.info('node kind: ' + ts.SyntaxKind[node.kind]);
      //logger.info('type flags: ' + ts.TypeFlags[type.flags]);
      //logger.info('type isUnion: ' + type.isUnion());
      //logger.info(
      //'type ' +
      //type
      //.getProperties()
      //.map((p) => p.name)
      //.toString()
      //);

      return quickInfo;
    };

    console.log('XXXX---LOADED---XXXX');
    return proxy;
  }

  return { create };
}

function findNodeAtPosition(
  sourceFile: ts.SourceFile,
  position: number
): ts.Node | undefined {
  function find(node: ts.Node): ts.Node | undefined {
    if (position >= node.getStart() && position < node.getEnd()) {
      return ts.forEachChild(node, find) || node;
    }
    return undefined;
  }
  return find(sourceFile);
}

export = init;
