import * as ts from 'typescript/lib/tsserverlibrary';
import { describe, expect, it } from 'vitest';
import { TypeInfoFactory } from '../../src/info';
import { createProxyFromCase, tagsToText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/review-edge-cases.ts'
);
const hover = (text: string) =>
	tagsToText(proxy.getQuickInfoAtPosition(absolutePath, code.indexOf(text) + 1));

describe('Edge cases', () => {
	it('handles recursive type aliases without overflowing the stack', () => {
		expect(hover("'a')")).toContain('json leaf');
	});

	it('escapes literal text after ${number} in template patterns', () => {
		expect(hover("'12xpx'")).not.toContain('px size');
		expect(hover("'12.px'")).toContain('px size');
	});

	it('drops cached infos when the program changes', () => {
		const fileName = '/virtual/stale.ts';
		let version = 0;
		let text = `type C = /** red doc */ 'red';\nconst c: C = 'red';`;
		const ls = ts.createLanguageService({
			getScriptFileNames: () => [fileName],
			getScriptVersion: () => String(version),
			getScriptSnapshot: (name) =>
				name === fileName ? ts.ScriptSnapshot.fromString(text) : undefined,
			getCurrentDirectory: () => '/',
			getCompilationSettings: () => ({ noLib: true }),
			getDefaultLibFileName: () => 'lib.d.ts',
			fileExists: (name) => name === fileName,
			readFile: () => undefined,
		});
		const factory = new TypeInfoFactory(ts, ls);
		const pos = text.lastIndexOf("'red'") + 1;
		expect(factory.getTypeInfo(fileName, pos)?.[0]?.docComment).toEqual([
			'red doc',
		]);

		text = text.replace('red doc', 'new doc');
		version++;
		expect(factory.getTypeInfo(fileName, pos)?.[0]?.docComment).toEqual([
			'new doc',
		]);
	});
});
