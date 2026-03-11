import { describe, it, expect } from 'vitest';
import { createProxyFromCase, documentationToText, tagText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/union-type-var.ts'
);

describe('Union Type Variable Docs Tests', () => {
	it('should find nothing', () => {
		const cursorPos = code.indexOf(`constNothing`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result!)).toBe('');
	});

	it('should find no extra documentation for blue', () => {
		const cursorPos = code.indexOf(`constBlue`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result!)).toBe('Const blue test');
	});

	it('should find doc comment of union type const with red', () => {
		const cursorPos = code.indexOf(`constRed`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result!)).toContain('Const red test\nPrimary color');
	});

	it('should find doc comment of union type const with green', () => {
		const cursorPos = code.indexOf(`constGreen`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result!)).toContain(
			'Const green test\nSecondary color with some regex symbols'
		);
		expect(tagText(result?.tags, 'color')).toBe('green');
	});
});
