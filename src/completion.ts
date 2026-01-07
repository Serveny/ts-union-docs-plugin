import type * as TS from 'typescript/lib/tsserverlibrary';
import { isRegexNode, UnionInfo } from './info';

export function addTemplateCompletions(
	ts: typeof TS,
	completion: TS.CompletionInfo,
	unionInfo: UnionInfo
) {
	const entries = createTemplateCompletions(ts, unionInfo);
	if (entries.length === 0) return;

	completion.optionalReplacementSpan;
	completion.entries.push(...entries);
	completion.entries.sort();
}

function createTemplateCompletions(
	ts: typeof TS,
	unionInfo: UnionInfo
): TS.CompletionEntry[] {
	const visitedNodes = new Set();

	const entries: TS.CompletionEntry[] = [];
	const templateNodes = unionInfo.entries.filter((n) => isRegexNode(n));
	if (templateNodes.length === 0) return entries;

	for (const tn of templateNodes) {
		const snippet = regexToSnippet(tn.text);
		if (visitedNodes.has(snippet)) continue;
		visitedNodes.add(snippet);

		const name = replaceSnippetDefaults(snippet);
		entries.push({
			name: name,
			kind: ts.ScriptElementKind.string,
			sortText: name,
			insertText: snippet,
			isSnippet: true,
		});
	}

	return entries;
}

function regexToSnippet(snippet: string): string {
	let i = 1;

	return snippet
		.replace(/\\d\+\(\\\.\\d\+\)\?/g, () => `\${${i++}:0}`)
		.replace(/\(true\|false\)/g, () => `\${${i++}:false}`)
		.replace(/\.\*/g, () => `\${${i++}:TEXT}`);
}

// Replace snippet syntax with default value
function replaceSnippetDefaults(str: string): string {
	return str.replace(/\$\{\d+:([^}]+)\}/g, '$1');
}

export function defaultComplInfo(): TS.CompletionInfo {
	return {
		isGlobalCompletion: false,
		isMemberCompletion: false,
		isNewIdentifierLocation: false,
		entries: [],
	};
}
