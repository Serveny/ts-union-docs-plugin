import * as ts from 'typescript/lib/tsserverlibrary';
import { describe, expect, it } from 'vitest';
import { createProxyFromCase, diagnosticMessages } from '../setup';

const { proxy, absolutePath } = createProxyFromCase(
	'tests/cases/deprecated-union-members.ts'
);

describe('Deprecated union member diagnostics', () => {
	it('does not report duplicate deprecated union usages as suggestion diagnostics', () => {
		const result = proxy.getSuggestionDiagnostics(absolutePath);
		const pluginDiagnostics = result.filter(
			(diag) => diag.source === 'ts-union-docs-plugin'
		);

		expect(pluginDiagnostics).toHaveLength(0);
	});

	it('reports deprecated union usages as semantic diagnostics', () => {
		const result = proxy.getSemanticDiagnostics(absolutePath);
		const messages = diagnosticMessages(result);

		expect(messages.filter((message) => message.includes('red')).length).toBe(2);
		expect(
			result.filter(
				(diag) =>
					diag.code === 6385 &&
					diag.category === ts.DiagnosticCategory.Suggestion
			)
		).toHaveLength(2);
	});

	it('marks deprecated semantic diagnostics with deprecation metadata', () => {
		const result = proxy.getSemanticDiagnostics(absolutePath);
		const pluginDiagnostics = result.filter(
			(diag) => diag.source === 'ts-union-docs-plugin'
		);

		expect(pluginDiagnostics).toHaveLength(2);
		expect(pluginDiagnostics.every((diag) => diag.reportsDeprecated != null)).toBe(
			true
		);
	});
});
