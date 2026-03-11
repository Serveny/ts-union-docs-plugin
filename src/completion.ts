import type * as TS from 'typescript/lib/tsserverlibrary';
import {
	CompletionContextInfo,
	getDeprecatedTag,
	getTagText,
	isRegexNode,
	UnionInfo,
} from './info';

export function applyCompletionInfo(
	ts: typeof TS,
	completion: TS.CompletionInfo,
	info: CompletionContextInfo
) {
	addTemplateCompletions(ts, completion, info.templateInfo);
	markDeprecatedEntries(completion, info.entryInfos);
}

export function addDeprecatedCompletionEntryDetails(
	details: TS.CompletionEntryDetails,
	unionInfo: UnionInfo
) {
	const deprecatedTag = getDeprecatedTag(unionInfo.tags);
	if (!deprecatedTag) return;

	details.tags = details.tags ? [...details.tags] : [];
	if (
		details.tags.some(
			(tag) =>
				tag.name === deprecatedTag.name &&
				getTagText(tag) === getTagText(deprecatedTag)
		)
	)
		return;

	details.tags.push(deprecatedTag);
}

export function defaultComplInfo(): TS.CompletionInfo {
	return {
		isGlobalCompletion: false,
		isMemberCompletion: false,
		isNewIdentifierLocation: false,
		entries: [],
	};
}

function addTemplateCompletions(
	ts: typeof TS,
	completion: TS.CompletionInfo,
	unionInfo: UnionInfo | null
) {
	if (!unionInfo) return;

	const entries = createTemplateCompletions(ts, unionInfo);
	if (entries.length === 0) return;
	completion.entries.push(...entries);
}

function markDeprecatedEntries(
	completion: TS.CompletionInfo,
	entryInfos: UnionInfo[]
) {
	const deprecatedNames = new Set(
		entryInfos
			.filter((entryInfo) => getDeprecatedTag(entryInfo.tags))
			.map((entryInfo) => entryInfo.name)
	);
	if (deprecatedNames.size === 0) return;

	for (const entry of completion.entries) {
		if (!deprecatedNames.has(entry.name)) continue;
		entry.kindModifiers = appendKindModifier(entry.kindModifiers, 'deprecated');
	}
}

function createTemplateCompletions(
	ts: typeof TS,
	unionInfo: UnionInfo
): TS.CompletionEntry[] {
	const visitedSnippets = new Set<string>();
	const templateNodes = unionInfo.entries.filter((node) => isRegexNode(node));
	if (templateNodes.length === 0) return [];

	const replacementSpan = getNodeTextSpan(unionInfo.initNode);
	const entries: TS.CompletionEntry[] = [];
	for (const templateNode of templateNodes) {
		const snippet = regexToSnippet(templateNode.text);
		if (visitedSnippets.has(snippet)) continue;
		visitedSnippets.add(snippet);

		const name = replaceSnippetDefaults(snippet);
		entries.push({
			name,
			kind: ts.ScriptElementKind.string,
			sortText: name,
			insertText: snippet,
			isSnippet: true,
			replacementSpan,
		});
	}

	return entries;
}

function regexToSnippet(snippet: string): string {
	let i = 1;

	return snippet
		.replace(/\\d\+\(\\\.\\d\+\)\?/g, () => `\${${i++}:0}`)
		.replace(/\(true\|false\)/g, () => `\${${i++}:false}`)
		.replace(/\.\*/g, () => `\${${i++}:TEXT}`)
		.replace(/\\/g, '');
}

// Replace snippet syntax with default value
function replaceSnippetDefaults(text: string): string {
	return text.replace(/\$\{\d+:([^}]+)\}/g, '$1');
}

function getNodeTextSpan(node: TS.Node): TS.TextSpan {
	const start = node.getStart() + 1;
	return {
		start,
		length: node.getWidth() - 2,
	};
}

function appendKindModifier(
	kindModifiers: string | undefined,
	modifier: string
) {
	const modifiers = new Set(
		(kindModifiers ?? '')
			.split(',')
			.map((part) => part.trim())
			.filter(Boolean)
	);
	modifiers.add(modifier);
	return [...modifiers].join(',');
}
