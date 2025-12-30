import type * as TS from 'typescript/lib/tsserverlibrary';
import { isRegexNode, UnionInfo } from './info';

export function addTemplateCompletions(
	ts: typeof TS,
	completion: TS.CompletionInfo,
	unionInfo: UnionInfo
) {
	const entries = createTemplateCompletions(ts, unionInfo);
	if (entries.length === 0) return;

	completion.entries.push(...entries);
	completion.entries.sort();
}

function createTemplateCompletions(
	ts: typeof TS,
	unionInfo: UnionInfo
): TS.CompletionEntry[] {
	const entries: TS.CompletionEntry[] = [];
	const templateNodes = unionInfo.entries.filter((n) => isRegexNode(n));
	if (templateNodes.length === 0) return entries;

	for (const tn of templateNodes) {
		const name = displayName(tn.text);
		entries.push({
			name: name,
			kind: ts.ScriptElementKind.string,
			sortText: name,
			insertText: tn.text,
			isSnippet: true,
		});
	}

	return entries;
}

function displayName(snippet: string): string {
	return snippet
		.replace(/\$\{\d+\|([^,|]+).*?\|\}/g, '$1')
		.replace(/\$\{\d+:([^}]+)\}/g, '$1')
		.replace(/\$\d+|\$\{\d+\}/g, '');
}
