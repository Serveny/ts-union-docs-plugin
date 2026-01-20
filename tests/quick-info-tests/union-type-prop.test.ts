import { describe, it, expect } from 'vitest';
import { createProxyFromCase, documentationToText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/union-type-prop.ts'
);

describe('Union Type Property Docs Tests', () => {
	it('should find nothing', () => {
		const cursorPos = code.indexOf(`public colorNothing`) + 8;
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result)).toBe('');
	});

	it('should find nothing for blue', () => {
		const cursorPos = code.indexOf(`public colorBlue`) + 8;
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result)).toBe('');
	});

	it('should find doc comment of union type prop with red', () => {
		const cursorPos = code.indexOf(`public colorRed`) + 8;
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result)).toContain('> Primary color');
	});

	it('should find doc comment of union type const with green', () => {
		const cursorPos = code.indexOf(`public colorGreen`) + 8;
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result)).toContain(
			`> Secondary color with some regex symbols\n> \n> \n> _@color_ green\n>`
		);
	});
});
