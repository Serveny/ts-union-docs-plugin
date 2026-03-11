import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagText, tagsToText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/nested-union-type-param.ts'
);

describe('Nested Union Type Param Docs Tests', () => {
	it('should find nothing of union type', () => {
		const cursorPos = code.indexOf(`logClassColor('')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!)).toBe('');
	});

	it('should find first js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logClassColor('Color-red')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagText(result?.tags, 'param')).toContain('color\n> Primary color');
	});

	it('should find second js doc comment of union type with regex symbols inside string', () => {
		const cursorPos = code.indexOf(
			`logClassColor('Color-green/[.*+?^\${}()|[]-]/g')`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain('color\n> Secondary color with some regex symbols');
		expect(paramText).toContain('> _@color_ green');
		expect(result?.tags?.some((tag) => tag.name === 'color')).toBe(false);
	});

	it('should find nothing of union type', () => {
		const cursorPos = code.indexOf(`logClassColor('Color-blue')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);

		expect(result).toBeDefined();
		expect(tagsToText(result!)).toBe('');
	});

	it('should find fourth js doc comment of union type', () => {
		const cursorPos = code.indexOf(`logClassColor('Color-A100')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain('color\n> A number');
		expect(paramText).toContain('> _@range_ 1-4');
		expect(result?.tags?.some((tag) => tag.name === 'range')).toBe(false);
	});

	it('should find nothing of double nested template', () => {
		const cursorPos = code.indexOf(`logNColor('')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);

		expect(result).toBeDefined();
		expect(tagsToText(result!)).toBe('');
	});

	it('should find first js doc comment of double nested template', () => {
		const cursorPos = code.indexOf(`logNColor('Color-1-red')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagText(result?.tags, 'param')).toContain('color\n> Primary color');
	});

	it('should find fourth js doc comment of double nested template', () => {
		const cursorPos = code.indexOf(`logNColor('Color-1-A1')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain('color\n> A number');
		expect(paramText).toContain('> _@range_ 1-4');
		expect(result?.tags?.some((tag) => tag.name === 'range')).toBe(false);
	});

	it('should find second js doc comment of double nested union type with regex symbols inside string', () => {
		const cursorPos = code.indexOf(
			`logNColor('Color-1-green/[.*+?^\${}()|[]-]/g')`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain('color\n> Secondary color with some regex symbols');
		expect(paramText).toContain('> _@color_ green');
		expect(result?.tags?.some((tag) => tag.name === 'color')).toBe(false);
	});
});
