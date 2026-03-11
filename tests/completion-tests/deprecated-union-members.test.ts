import { describe, expect, it } from 'vitest';
import { createProxyFromCase, findCompletionEntry, tagText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/deprecated-union-members.ts'
);

describe('Deprecated union member completions', () => {
	it('marks deprecated union entries in the completion list', () => {
		const cursorPos = code.indexOf(`paint('');`) + `paint('`.length;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});

		expect(result).toBeDefined();
		expect(findCompletionEntry(result!, 'red')?.kindModifiers).toContain(
			'deprecated'
		);
	});

	it('surfaces deprecation metadata in completion details', () => {
		const cursorPos =
			code.indexOf(`const completionColor: DeprecatedColor = '';`) +
			`const completionColor: DeprecatedColor = '`.length;
		const result = proxy.getCompletionEntryDetails(
			absolutePath,
			cursorPos,
			'red',
			{},
			undefined,
			undefined,
			undefined
		);

		expect(result).toBeDefined();
		expect(tagText(result?.tags, 'deprecated') ?? '').toContain(
			'Use "blue" instead.'
		);
	});
});
