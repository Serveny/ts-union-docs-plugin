import type * as TS from 'typescript/lib/tsserverlibrary';

export function getTagText(tag: TS.JSDocTagInfo | undefined): string {
	return tag?.text?.map((part) => part.text).join('') ?? '';
}

export function getDeprecatedTag(
	tags: readonly TS.JSDocTagInfo[] | undefined
): TS.JSDocTagInfo | undefined {
	return tags?.find((tag) => tag.name === 'deprecated');
}

export function isMarkdownTableLine(line: string): boolean {
	return /^\|.*\|$/.test(line);
}

export function dedupeTagInfos(
	tags: readonly TS.JSDocTagInfo[]
): TS.JSDocTagInfo[] {
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
