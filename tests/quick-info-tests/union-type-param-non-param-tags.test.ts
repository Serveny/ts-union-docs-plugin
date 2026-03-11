import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/union-type-param-non-param-tags.ts'
);

describe('Union Type Param Non-Param Tags Tests', () => {
	it('should not duplicate existing non-param tags when injecting param docs', () => {
		const cursorPos = code.indexOf(`paint('red')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagText(result?.tags, 'param')).toContain('color\n> Primary color');
		expect(result?.tags?.filter((tag) => tag.name === 'returns')).toHaveLength(1);
		expect(result?.tags?.filter((tag) => tag.name === 'deprecated')).toHaveLength(
			1
		);
	});
});
