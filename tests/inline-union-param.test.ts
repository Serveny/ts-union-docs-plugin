import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagsToText } from './_test_setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/inline-union-param.ts'
);

describe('Inline Union Param Docs Tests', () => {
	it('should find nothing', () => {
		const cursorPos = code.indexOf(`testFn('baz')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toBe('');
	});

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`testFn('')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toBe('');
	});

	it('should find first inline js doc comment of union parameter', () => {
		const cursorPos = code.indexOf(`testFn('foo')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('x\n> foo docs\n');
	});

	it('should find second inline js doc comment of union parameter', () => {
		const cursorPos = code.indexOf(`testFn('bar')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('x\n> bar docs\n');
	});
});
