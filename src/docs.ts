import type * as TS from 'typescript/lib/tsserverlibrary';
import { getTagText, SupportedType, UnionInfo } from './info';

type IndexedTag = {
	tag: TS.JSDocTagInfo;
	idx: number;
};

type TagSections = {
	before: TS.JSDocTagInfo[];
	params: IndexedTag[];
	after: TS.JSDocTagInfo[];
};

export function addExtraQuickInfo(
	_ts: typeof TS,
	quickInfo: TS.QuickInfo,
	typesInfo: UnionInfo[]
) {
	const primaryInfo = typesInfo[0];
	if (!primaryInfo) return;

	switch (primaryInfo.type) {
		case SupportedType.Parameter:
			return addExtraParamTagInfo(quickInfo, typesInfo);
		case SupportedType.Variable:
			return addExtraVariableQuickInfo(quickInfo, typesInfo);
	}
}

export function createFallbackQuickInfo(
	ts: typeof TS,
	pos: number,
	typeInfo: UnionInfo[]
): TS.QuickInfo {
	return {
		kind: ts.ScriptElementKind.string,
		kindModifiers: '',
		textSpan: {
			start: pos,
			length: typeInfo[0]?.value?.length ?? 1,
		},
		displayParts: typeInfo[0]?.value
			? [
					{
						kind: 'stringLiteral',
						text: JSON.stringify(typeInfo[0].value),
					},
				]
			: undefined,
	};
}

function addExtraParamTagInfo(quickInfo: TS.QuickInfo, typesInfo: UnionInfo[]) {
	const { before, params, after } = splitParamTagSections(quickInfo.tags);
	const mergedParamTags = buildParamTags(typesInfo, params);
	quickInfo.tags = dedupeTagInfos([...before, ...mergedParamTags, ...after]);
}

function addExtraVariableQuickInfo(quickInfo: TS.QuickInfo, typesInfo: UnionInfo[]) {
	addExtraDocumentation(quickInfo, typesInfo);
	appendUnionTags(quickInfo, typesInfo);
}

function addExtraDocumentation(quickInfo: TS.QuickInfo, typesInfo: UnionInfo[]) {
	const newDocs = quickInfo.documentation ? [...quickInfo.documentation] : [];

	for (const typeInfo of typesInfo) {
		const docComment = typeInfo.docComment;
		if (!docComment || docComment.length === 0) continue;
		if (newDocs.length > 0) newDocs.push(createTextDisplayPart('\n'));
		newDocs.push(createMarkdownDisplayPart(formatDocComment(docComment)));
	}
	quickInfo.documentation = newDocs;
}

function appendUnionTags(quickInfo: TS.QuickInfo, typesInfo: UnionInfo[]) {
	const tags = quickInfo.tags ? [...quickInfo.tags] : [];
	for (const typeInfo of typesInfo) tags.push(...cloneTags(typeInfo.tags));
	quickInfo.tags = dedupeTagInfos(tags);
}

function splitParamTagSections(
	tags: readonly TS.JSDocTagInfo[] | undefined
): TagSections {
	const allTags = tags ? [...tags] : [];
	const params = indexTags(allTags, 'param');
	if (params.length === 0) {
		return {
			before: allTags,
			params,
			after: [],
		};
	}

	const firstParamIndex = params[0]!.idx;
	const lastParamIndex = params[params.length - 1]!.idx;

	return {
		before: allTags.slice(0, firstParamIndex),
		params,
		after: allTags.slice(lastParamIndex + 1),
	};
}

function indexTags(
	tags: readonly TS.JSDocTagInfo[],
	name: string
): IndexedTag[] {
	return tags
		.map((tag, idx) => ({ tag, idx }))
		.filter((entry) => entry.tag.name === name);
}

function buildParamTags(
	typesInfo: UnionInfo[],
	existingParamTags: IndexedTag[]
): TS.JSDocTagInfo[] {
	const paramTags: TS.JSDocTagInfo[] = [];

	for (const typeInfo of typesInfo) {
		if (!hasDocMetadata(typeInfo)) continue;

		const jsDocTag = findJsDocParamTagByName(existingParamTags, typeInfo.name);
		const tag = jsDocTag?.tag ?? defaultParamJSDocTag(typeInfo.name);
		paramTags.push(
			addParamTagDescription(tag, typeInfo.docComment, typeInfo.tags)
		);
	}

	return paramTags;
}

function hasDocMetadata(
	typeInfo: Pick<UnionInfo, 'docComment' | 'tags'>
): boolean {
	return (typeInfo.docComment?.length ?? 0) > 0 || (typeInfo.tags?.length ?? 0) > 0;
}

function findJsDocParamTagByName(
	tags: IndexedTag[],
	name: string
): IndexedTag | null {
	return (
		tags.find(({ tag }) =>
			tag.text?.some(
				(textPart) =>
					textPart.kind === 'parameterName' &&
					textPart.text.toLowerCase() === name.toLowerCase()
			)
		) ?? null
	);
}

function defaultParamJSDocTag(name: string): TS.JSDocTagInfo {
	return {
		name: 'param',
		text: [
			{
				kind: 'parameterName',
				text: name,
			},
		],
	};
}

function createMarkdownDisplayPart(mdText: string): TS.SymbolDisplayPart {
	return {
		text: mdText,
		kind: 'markdown',
	} as TS.SymbolDisplayPart;
}

function addParamTagDescription(
	oldTag: TS.JSDocTagInfo,
	docComment: string[] | undefined,
	extraTags: readonly TS.JSDocTagInfo[] | undefined
): TS.JSDocTagInfo {
	const newTag = cloneTag(oldTag);
	const docText = formatQuotedParamDocComment(docComment, extraTags);
	if (!docText) return newTag;
	if (!newTag.text) newTag.text = [];
	if (newTag.text.length > 0) {
		newTag.text.push(createTextDisplayPart('\n'));
	}
	newTag.text.push(createMarkdownDisplayPart(docText));
	return newTag;
}

function formatDocComment(lines: string[]): string {
	return lines.join('\n');
}

function formatQuotedParamDocComment(
	lines: string[] | undefined,
	extraTags: readonly TS.JSDocTagInfo[] | undefined
): string {
	const parts: string[] = [];
	if (lines && lines.length > 0) {
		parts.push(...lines.map((line) => `> ${line}`));
	}
	if (extraTags && extraTags.length > 0) {
		if (parts.length > 0) parts.push('> ');
		for (const [index, tag] of extraTags.entries()) {
			if (index > 0) parts.push('> ');
			parts.push(...formatQuotedParamTag(tag));
		}
	}
	return parts.join('\n');
}

function formatQuotedParamTag(tag: TS.JSDocTagInfo): string[] {
	const text = getTagText(tag);
	if (!text) return [`> _@${tag.name}_`];

	const lines = text.split('\n');
	const [firstLine, ...restLines] = lines;
	if (isMarkdownTableLine(firstLine)) {
		return ['> _@' + tag.name + '_', '> ', ...lines.map((line) => `> ${line}`)];
	}

	return [
		`> _@${tag.name}_ ${firstLine}`,
		...restLines.map((line) => `> ${line}`),
	];
}

function createTextDisplayPart(text: string): TS.SymbolDisplayPart {
	return {
		text,
		kind: 'text',
	} as TS.SymbolDisplayPart;
}

function isMarkdownTableLine(line: string): boolean {
	return /^\|.*\|$/.test(line);
}

function cloneTags(
	tags: readonly TS.JSDocTagInfo[] | undefined
): TS.JSDocTagInfo[] {
	return tags?.map(cloneTag) ?? [];
}

function cloneTag(tag: TS.JSDocTagInfo): TS.JSDocTagInfo {
	return {
		name: tag.name,
		text: tag.text?.map((part) => ({ ...part })),
	};
}

function dedupeTagInfos(tags: readonly TS.JSDocTagInfo[]): TS.JSDocTagInfo[] {
	const seen = new Set<string>();
	const unique: TS.JSDocTagInfo[] = [];

	for (const tag of tags) {
		const key = `${tag.name}:${getTagText(tag)}`;
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(tag);
	}

	return unique;
}
