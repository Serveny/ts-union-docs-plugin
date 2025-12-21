import type * as TS from 'typescript/lib/tsserverlibrary';
import { describe, it, expect } from 'vitest';
import { createProxyFromCase } from './setup';

function tagsToText(quickInfo: TS.QuickInfo) {
	return quickInfo.tags
		?.map((tag) => tag.text?.map((t) => t.text)?.join(''))
		.join('');
}

describe('Inline Union Param Docs Tests', () => {
	const filePath = 'tests/cases/inline-union-param.ts';
	const { proxy, absolutePath, code } = createProxyFromCase(filePath);

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`testFn('baz')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('');
	});

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`testFn('')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('');
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

describe('Union Type Param Docs Tests', () => {
	const filePath = 'tests/cases/union-type-param.ts';
	const { proxy, absolutePath, code } = createProxyFromCase(filePath);

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`logColor('')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('');
	});

	it('should find first js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logColor('red')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('color\n> Primary color\n');
	});

	it('should find second js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logColor('green')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain(
			'color\n> Secondary color\n> \n> \n> _@color_ green'
		);
	});

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`logColor('blue')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);

		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('');
	});

	it('should find fourth js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logColor('A100')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain(
			'color\n> A number\n> \n> \n> _@range_ 1-4'
		);
	});
});

describe('Nested Union Type Param Docs Tests', () => {
	const filePath = 'tests/cases/union-type-param.ts';
	const { proxy, absolutePath, code } = createProxyFromCase(filePath);

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`logClassColor('')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('');
	});

	it('should find first js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logClassColor('Color-red')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('color\n> Primary color\n');
	});

	it('should find second js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logClassColor('Color-green')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain(
			'color\n> Secondary color\n> \n> \n> _@color_ green'
		);
	});

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`logClassColor('Color-blue')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);

		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain('');
	});

	it('should find fourth js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logClassColor('Color-A100')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toContain(
			'color\n> A number\n> \n> \n> _@range_ 1-4'
		);
	});
});
