import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/union-type-prop.ts'
);

describe('Union Type Constructor Params Test', () => {
	it('should find doc comment of union type constructor params', () => {
		const cursorPos =
			code.indexOf(`const palette = new VariableColorPalette(`) + 30;
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagText(result?.tags, 'param')).toContain('color2\n> Primary color');
		expect(tagText(result?.tags, 'param')).toContain(
			'color3\n> A number\n> \n> _@range_ 1-4'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'color4\n> Two numbers in one template'
		);
		expect(result?.tags?.some((tag) => tag.name === 'range')).toBe(false);
	});
});
