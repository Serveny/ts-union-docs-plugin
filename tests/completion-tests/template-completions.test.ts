import { describe, it, expect } from 'vitest';
import { completionSnippetNames, createProxyFromCase } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/template-type.ts'
);

describe('Completion template type test 1', () => {
	it('should suggest dynamic template types for function parameter', () => {
		const cursorPos = code.indexOf(`logColor('red');`) + 11;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});
		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual(['red-0']);
	});

	it('should suggest dynamic template types for variable', () => {
		const cursorPos = code.indexOf(`const color: Color = 'red';`) + 23;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});
		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual(['red-0']);
	});
});

describe('Completion template type test 2', () => {
	it('should suggest dynamic template types for function parameter', () => {
		const cursorPos = code.indexOf(`logPrettyColor('Pretty-red');`) + 11;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});
		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual(['Pretty-red-0']);
	});

	it('should suggest dynamic template types for variable', () => {
		const cursorPos =
			code.indexOf(`const prettyColor: PrettyColor = 'Pretty-red';`) + 35;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});
		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual(['Pretty-red-0']);
	});
});

describe('Completion template type test 3', () => {
	it('should suggest dynamic template types for function parameter', () => {
		const cursorPos = code.indexOf(`logPrettyNColor('Pretty-1-red');`) + 11;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});
		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual([
			'Pretty-0-red',
			'Pretty-0-red-dark',
			'Pretty-0-red-bright',
			'Pretty-0-red-0',
		]);
	});

	it('should suggest dynamic template types for variable', () => {
		const cursorPos =
			code.indexOf(`const prettyNColor: PrettyNColor = 'Pretty-1-red';`) + 35;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});
		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual([
			'Pretty-0-red',
			'Pretty-0-red-dark',
			'Pretty-0-red-bright',
			'Pretty-0-red-0',
		]);
	});
});
