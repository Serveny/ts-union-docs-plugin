import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagsToText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/union-type-prop.ts'
);

describe('Union Type Constructor Params Test', () => {
	it('should find doc comment of union type constructor params', () => {
		const cursorPos =
			code.indexOf(`const palette = new VariableColorPalette(`) + 30;
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result)).toContain(
			`color2
> Primary color
> color3
> A number
> 
> 
> _@range_ 1-4
> color4
> Two numbers in one template`
		);
	});
});
