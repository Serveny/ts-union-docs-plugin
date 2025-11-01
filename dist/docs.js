"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addExtraDocs = addExtraDocs;
function addExtraDocs(ts, quickInfo, typeInfo) {
    if (typeInfo.unionParams.length === 0)
        return;
    typeInfo.unionParams.forEach((p) => addDocComment(ts, p));
    quickInfo.documentation = [
        ...(quickInfo.documentation ?? []),
        {
            text: createMarkdown(typeInfo),
            kind: 'markdown',
        },
    ];
}
function addDocComment(ts, param) {
    for (const node of param.entries) {
        // If the node was resolved, get the original node
        const nodeWithDocs = node.original ?? node;
        const sourceFile = nodeWithDocs.getSourceFile();
        if (!sourceFile)
            continue;
        param.docComment = extractJSDocsFromNode(ts, nodeWithDocs, sourceFile);
    }
}
function createMarkdown(typeInfo) {
    const paramBlocks = typeInfo.unionParams.map((pi) => paramMarkdown(pi));
    return `\n
---
### 🌟 Parameter-Details
${paramBlocks.join('\n')}
`;
}
function paramMarkdown(info) {
    const docs = info.docComment?.join('\n') ?? '';
    return `\n#### ${numberEmoji(info.i + 1)} ${info.name}: _${info.value}_\n${docs}`;
}
function extractJSDocsFromNode(ts, node, sourceFile) {
    const sourceText = sourceFile.getFullText();
    const start = node.getStart();
    const comment = getLeadingComment(ts, sourceText, start);
    return comment
        ? prepareJSDocText(sourceText.substring(comment.pos, comment.end))
        : [];
}
function getLeadingComment(ts, text, pos) {
    const comments = ts.getLeadingCommentRanges(text, pos) ?? [];
    // jsdoc comment (has to start with /**)
    if (comments.length > 0 && text[comments[0].pos + 2] === '*')
        return comments[comments.length - 1];
    text = text.substring(0, pos);
    const commentStart = text.lastIndexOf('/**');
    if (commentStart === -1)
        return;
    const commentEnd = text.lastIndexOf('*/');
    if (commentEnd === -1)
        return;
    const textBetween = text.substring(commentEnd + 2, pos);
    if (/[^ \t|\n]/.test(textBetween))
        return;
    return {
        pos: commentStart + 3,
        end: commentEnd,
        kind: ts.SyntaxKind.MultiLineCommentTrivia,
    };
}
function prepareJSDocText(rawComment) {
    return (rawComment
        .replace('/**', '')
        .replace('*/', '')
        .split('\n')
        // remove whitespace and the leading * in every line
        .map((line) => line.trim().replace(/^\* ?/, ''))
        // make @tags fat again
        .map((line) => line.replace(/@(\w+)/g, (_, tag) => `\n**@${tag}**`)));
}
const numEmjs = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
function numberEmoji(num) {
    if (num === 10)
        return '🔟';
    return [...String(num)].map((char) => numEmjs[parseInt(char, 10)]);
}
//# sourceMappingURL=docs.js.map