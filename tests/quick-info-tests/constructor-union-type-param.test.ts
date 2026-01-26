import { describe, it, expect } from 'vitest';
import { createProxyFromCase, documentationToText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/union-type-prop.ts'
);

describe('Union Type Constructor Params Test', () => {
	it('should find doc comment of union type constructor params', () => {
		const cursorPos =
			code.indexOf(`const palette = new VariableColorPalette(`) + 22;
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(documentationToText(result)).toContain(
			`@param color2

> Primary color

@param color3

> Secondary color with some regex symbols

> @color green

@param color4

> Two numbers in one template`
		);
	});
});
