import type * as TS from 'typescript/lib/tsserverlibrary';
import { DeprecatedUsageInfo, getDeprecatedTag, getTagText } from './info';

export function createDeprecatedSemanticDiagnostics(
	ts: typeof TS,
	usages: DeprecatedUsageInfo[]
): TS.Diagnostic[] {
	return createDeprecatedDiagnostics(ts, usages);
}

export function createDeprecatedSuggestionDiagnostics(
	ts: typeof TS,
	usages: DeprecatedUsageInfo[]
): TS.DiagnosticWithLocation[] {
	return createDeprecatedDiagnostics(ts, usages);
}

function createDeprecatedDiagnostics(
	ts: typeof TS,
	usages: DeprecatedUsageInfo[]
): TS.DiagnosticWithLocation[] {
	const diagnostics: TS.DiagnosticWithLocation[] = [];

	for (const { node, info } of usages) {
		const deprecatedTag = getDeprecatedTag(info.tags);
		if (!deprecatedTag) continue;

		diagnostics.push({
			file: node.getSourceFile(),
			start: node.getStart(),
			length: node.getWidth(),
			category: ts.DiagnosticCategory.Suggestion,
			code: 6385,
			messageText: formatDeprecatedMessage(node.getText(), deprecatedTag),
			source: 'ts-union-docs-plugin',
			reportsDeprecated: {},
		});
	}

	return diagnostics;
}

function formatDeprecatedMessage(
	nodeText: string,
	deprecatedTag: TS.JSDocTagInfo
): string {
	const tagText = getTagText(deprecatedTag);
	return tagText
		? `${nodeText} is deprecated. ${tagText}`
		: `${nodeText} is deprecated.`;
}
