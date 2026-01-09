import { describe, it, expect } from 'vitest';
import { completionSnippetNames, createProxyFromCase } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/mixxx-types.ts'
);

describe('Mixxx Types Param Completion Tests', () => {
	it('should suggest all dynamic Mixxx groups', () => {
		const cursorPos = code.indexOf(`getValue('', '')`) + 10;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});

		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual([
			'[Auxiliary0]',
			'[Channel0]',
			'[EffectRack1_EffectUnit0]',
			'[EffectRack1_EffectUnit0_Effect0]',
			'[EqualizerRack1_[Channel0]]',
			'[EqualizerRack1_[Channel0]_Effect1]',
			'[Microphone0]',
			'[PreviewDeck0]',
			'[QuickEffectRack1_[Channel0]]',
			'[QuickEffectRack1_[Channel0]_Effect1]',
			'[Sampler0]',
		]);
	});

	it('should suggest no Mixxx controls', () => {
		const cursorPos = code.indexOf(`getValue('', '')`) + 14;
		const result = proxy.getCompletionsAtPosition(absolutePath, cursorPos, {});

		expect(result).toBeDefined();
		expect(completionSnippetNames(result!)).toStrictEqual([]);
	});
});
