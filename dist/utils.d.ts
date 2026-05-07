import type * as TS from 'typescript/lib/tsserverlibrary';
export declare function getTagText(tag: TS.JSDocTagInfo | undefined): string;
export declare function getDeprecatedTag(tags: readonly TS.JSDocTagInfo[] | undefined): TS.JSDocTagInfo | undefined;
export declare function isMarkdownTableLine(line: string): boolean;
export declare function dedupeTagInfos(tags: readonly TS.JSDocTagInfo[]): TS.JSDocTagInfo[];
