import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagsToText } from '../setup';

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
});
