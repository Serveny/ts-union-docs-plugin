import type * as TS from 'typescript/lib/tsserverlibrary';
import { SupportedType, UnionInfo } from './info';

type TagIdx = {
	tag: TS.JSDocTagInfo;
	idx: number;
};

export function addExtraQuickInfo(
	_ts: typeof TS,
	quickInfo: TS.QuickInfo,
	typesInfo: UnionInfo[]
) {
	if (typesInfo.length === 0) return;

	switch (typesInfo[0].type) {
		case SupportedType.Parameter:
			return addExtraJDocTagInfo(quickInfo, typesInfo);
		case SupportedType.Variable:
			return addExtraDocumentation(quickInfo, typesInfo);
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

function addExtraJDocTagInfo(quickInfo: TS.QuickInfo, typesInfo: UnionInfo[]) {
	if (!quickInfo.tags) quickInfo.tags = [];

	const tagIdxs: TagIdx[] =
		quickInfo.tags
			.map((tag, idx) => ({ tag, idx }))
			.filter((entry) => entry.tag.name === 'param');

	const newTags = [
		...(tagIdxs.length > 0
			? quickInfo.tags.filter((_, i) => i < tagIdxs[0].idx)
			: quickInfo.tags),
	];

	for (const typeInfo of typesInfo) {
		const jsDocTag = findJsDocParamTagByName(tagIdxs, typeInfo.name);
		if ((typeInfo.docComment?.length ?? 0) === 0) continue;

		const tag = jsDocTag?.tag ?? defaultParamJSDocTag(typeInfo.name);
		newTags.push(addTagInfo(tag, typeInfo));
	}

	const lastParamTagIdx =
		tagIdxs.length === 0 ? 0 : (tagIdxs[tagIdxs.length - 1]?.idx ?? 0);
	if (quickInfo.tags.length - 1 > lastParamTagIdx)
		newTags.push(...quickInfo.tags.filter((_, i) => i > lastParamTagIdx));

	quickInfo.tags = newTags;
}

function addExtraDocumentation(
	quickInfo: TS.QuickInfo,
	typesInfo: UnionInfo[]
) {
	const newDocs = quickInfo.documentation ? [...quickInfo.documentation] : [];

	for (const typeInfo of typesInfo) {
		if ((typeInfo.docComment?.length ?? 0) === 0) continue;
		newDocs.push(
			createMarkdownDisplayPart(formatDocComment(typeInfo.docComment ?? []))
		);
	}
	quickInfo.documentation = newDocs;
}

function findJsDocParamTagByName(tags: TagIdx[], name: string): TagIdx | null {
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
				kind: 'keyword',
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

function addTagInfo(
	oldTag: TS.JSDocTagInfo,
	typeInfo: UnionInfo | undefined
): TS.JSDocTagInfo {
	if (!typeInfo?.docComment) return oldTag;

	const newTag: TS.JSDocTagInfo = JSON.parse(JSON.stringify(oldTag));
	if (!newTag.text) newTag.text = [];
	newTag.text.push(createMarkdownDisplayPart(formatDocComment(typeInfo.docComment)));
	return newTag;
}

function formatDocComment(lines: string[]): string {
	return lines.map((line, index) => (index > 0 ? `> ${line}` : line)).join('\n');
}
