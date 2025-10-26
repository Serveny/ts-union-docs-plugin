import * as ts from 'typescript/lib/tsserverlibrary';

export function extractJsDoc(unionNode: ts.UnionTypeNode): string[] {
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

export function addExtraDocsToQuickInfo(
  extraDocs: string[],
  quickInfo: ts.QuickInfo
) {
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
