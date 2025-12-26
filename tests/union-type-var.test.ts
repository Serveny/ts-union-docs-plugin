import { describe, it, expect } from 'vitest';
import { createProxyFromCase, documentationToText } from './_test_setup';

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
		expect(documentationToText(result!)).toContain(
			'Const red test\n> Primary color'
		);
	});

	it('should find doc comment of union type const with green', () => {
		const cursorPos = code.indexOf(`constGreen`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result!)).toContain(
			`Const green test\n> Secondary color with some regex symbols\n> \n> \n> _@color_ green\n>`
		);
	});
});
