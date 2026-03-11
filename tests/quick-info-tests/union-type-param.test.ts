import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagText, tagsToText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/union-type-param.ts'
);

describe('Union Type Param Docs Tests', () => {
	it('should find nothing', () => {
		const cursorPos = code.indexOf(`logColor('')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toBe('');
	});

	it('should find first js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logColor('red')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagText(result?.tags, 'param')).toContain('color\n> Primary color');
	});

	it('should find second js doc comment of union type with regex symbols inside string', () => {
		const cursorPos = code.indexOf(`logColor('green/[.*+?^\${}()|[]-]/g');`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain('color\n> Secondary color with some regex symbols');
		expect(paramText).toContain('> _@color_ green');
		expect(result?.tags?.some((tag) => tag.name === 'color')).toBe(false);
	});

	it('should find nothing', () => {
		const cursorPos = code.indexOf(`logColor('blue')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);

		expect(result).toBeDefined();
		expect(tagsToText(result!)).toBe('');
	});

	it('should find fourth js doc comment of union type template', () => {
		const cursorPos = code.indexOf(`logColor('A100')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain('color\n> A number');
		expect(paramText).toContain('> _@range_ 1-4');
		expect(result?.tags?.some((tag) => tag.name === 'range')).toBe(false);
	});

	it('should find fith js doc comment of union type template containing two numbers', () => {
		const cursorPos = code.indexOf(`logColor('1B27')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagText(result?.tags, 'param')).toContain(
			'color\n> Two numbers in one template'
		);
	});
});
