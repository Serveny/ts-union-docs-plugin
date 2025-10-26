import type * as TS from 'typescript/lib/tsserverlibrary';
import { UnionParameterInfo } from './info';

export function extractJsDocs(
	ts: typeof TS,
	param: UnionParameterInfo
): string[] {
	let unionTypeNode: TS.UnionTypeNode | undefined = undefined;

	// is inline union (i.e. param: string | number)
	if (ts.isUnionTypeNode(param.node)) {
		unionTypeNode = param.node;
	}

	if (unionTypeNode) {
		const sourceFile = unionTypeNode.getSourceFile();
		return extractJSDocsFromUnionNode(ts, param, sourceFile);
	}

	return [];
}

export function addExtraDocs(quickInfo: TS.QuickInfo, extraDocs: string[]) {
	quickInfo.documentation = extraDocs.map(
		(c) => ({ text: c, kind: 'text' } as TS.SymbolDisplayPart)
	);
}

function extractJSDocsFromUnionNode(
	ts: typeof TS,
	param: UnionParameterInfo,
	sourceFile: TS.SourceFile
): string[] {
	const sourceText = sourceFile.getFullText();
	const unionEntry = param.node.types.find((n) =>
		ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal)
			? n.literal.text === param.value
			: false
	);
	if (!unionEntry) return [];

	const start = unionEntry.getStart();
	const comment = getLeadingComment(ts, sourceText, start);
	if (comment) {
		return cleanJSDocText(sourceText.substring(comment.pos, comment.end));
	}

	return [];
}

function getLeadingComment(
	ts: typeof TS,
	text: string,
	pos: number
): TS.CommentRange | undefined {
	const comments = ts.getLeadingCommentRanges(text, pos) ?? [];
	// jsdoc comment (has to start with /**)
	if (comments.length > 0 && text[comments[0].pos + 2] === '*')
		return comments[comments.length - 1];
	text = text.substring(0, pos);
	const commentStart = text.lastIndexOf('/**');
	if (commentStart === -1) return;
	const commentEnd = text.lastIndexOf('*/');
	if (commentEnd === -1) return;
	const textBetween = text.substring(commentEnd + 2, pos);
	if (/[^ \t|\n]/.test(textBetween)) return;
	return {
		pos: commentStart + 3,
		end: commentEnd,
		kind: ts.SyntaxKind.MultiLineCommentTrivia,
	};
}

function cleanJSDocText(rawComment: string): string[] {
	return (
		rawComment
			.replace('/**', '')
			.replace('*/', '')
			.split('\n')
			// remove whitespace and the leading * in every line
			.map((line) => line.trim().replace(/^\* ?/, ''))
	);
}
