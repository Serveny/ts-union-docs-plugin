import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagText, tagsToText } from '../setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/mixxx-types.ts'
);

describe('Mixxx Types Param Docs Tests', () => {
	it('should find gui_tick_50ms_period_s docs', () => {
		const cursorPos = code.indexOf(
			`getValue('[App]', 'gui_tick_50ms_period_s')`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();

		const text = tagsToText(result);
		expect(text).toContain(
			'The [App] group contains controls that do not belong to a specific channel, the mixer or the effects engine.'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'Name of the control e.g. "play_indicator"\n> A throttled timer that provides the time elapsed in seconds since Mixxx was started.'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'> _@groups_ [App]\n> \n> _@range_ 0.0 .. n'
		);
		expect(tagText(result?.tags, 'param')).toContain('> _@feedback_ None');
		expect(tagText(result?.tags, 'param')).toContain(
			'> _@since_ New in version 2.4.0.'
		);
		expect(tagText(result?.tags, 'param')).toContain('> _@readonly_');
		expect(result?.tags?.some((tag) => tag.name === 'groups')).toBe(false);
	});

	it('should find beatloop_size docs', () => {
		const cursorPos = code.indexOf(`getValue('[Channel1]', 'beatloop_size')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();

		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain(
			'> Each deck in Mixxx corresponds to a [ChannelN] group.\n> Whenever you see [ChannelN], think “Deck N”.\n> N can range from 1 to the number of active decks in Mixxx.'
		);
		expect(paramText).toContain(
			'Name of the control e.g. "play_indicator"\n> Set the length of the loop in beats that will get set with'
		);
		expect(paramText).toContain(
			'> _@groups_ [ChannelN], [PreviewDeckN], [SamplerN]\n> \n> _@range_ positive real number'
		);
		expect(paramText).toContain('Beatloop size spinbox');
		expect(paramText).toContain('> _@since_ New in version 2.1.0.');
		expect(result?.tags?.some((tag) => tag.name === 'groups')).toBe(false);
	});

	it('should find rate_up_small docs', () => {
		const cursorPos = code.indexOf(
			`setValue('[Sampler1]', 'rate_up_small', 1)`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();

		const text = tagsToText(result);
		expect(text).toContain(
			'Sample decks are identical to regular decks, but are used for playing samples; their controls mirror [ChannelN].'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'Name of the control e.g. "play_indicator"\n> Speed control\n> This is a ControlPotMeter control.'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'> _@groups_ [ChannelN], [PreviewDeckN], [SamplerN]\n> \n> _@range_ -1.0..1.0'
		);
		expect(tagText(result?.tags, 'param')).toContain('> _@feedback_ Speed slider');
		expect(tagText(result?.tags, 'param')).toContain(
			'> _@kind_ pot meter control'
		);
		expect(result?.tags?.some((tag) => tag.name === 'groups')).toBe(false);
	});

	it('should find parameter1_down_small docs', () => {
		const cursorPos = code.indexOf(
			`setValue('[EffectRack1_EffectUnit1_Effect1]', 'parameter1_down_small', 1)`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();

		const text = tagsToText(result);
		expect(text).toContain(
			'The [EffectRack1_EffectUnitN_EffectM] group contains controls for a single effect slot within an effects unit.'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'Name of the control e.g. "play_indicator"\n> The scaled value of the Kth parameter.'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'> _@groups_ [EffectRack1_EffectUnitN_EffectM], [EqualizerRack1_[ChannelI]_Effect1], [QuickEffectRack1_[ChannelI]_Effect1], [QuickEffectRack1_[ChannelI_StemJ]_Effect1]\n> \n> _@range_ double'
		);
		expect(tagText(result?.tags, 'param')).toContain(
			'> _@kind_ pot meter control'
		);
		expect(result?.tags?.some((tag) => tag.name === 'groups')).toBe(false);
	});

	it('should find beatjump docs when the group comes from a const', () => {
		const cursorPos = code.indexOf(
			`setValue(channelGroup, 'beatjump_4_backward', 42)`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();

		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain(
			'> Each deck in Mixxx corresponds to a [ChannelN] group.\n> Whenever you see [ChannelN], think “Deck N”.\n> N can range from 1 to the number of active decks in Mixxx.'
		);
		expect(paramText).toContain(
			'Name of the control e.g. "play_indicator"\n> Jump backward by X beats.'
		);
	});

	it('should render multiline range tables inside the param hover', () => {
		const cursorPos = code.indexOf(`getValue('[Channel1]', 'cue_mode')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();

		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain('> _@range_');
		expect(paramText).toContain('> |Value|compatible hardware|');
		expect(paramText).toContain('> |---|---|');
		expect(paramText).toContain('> |1.0|Pioneer mode|');
		expect(paramText).toContain('> |5.0|CUP (Cue + Play) mode|');
		expect(paramText).toContain('> \n> _@feedback_ None');
	});

	it('should only show docs for the concrete [Samplers] group', () => {
		const cursorPos = code.indexOf(`getValue('[Samplers]', 'show_samplers')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();

		const paramText = tagText(result?.tags, 'param') ?? '';
		expect(paramText).toContain(
			'> The [Samplers] group contains deprecated controls for showing sampler banks in the user interface of Mixxx.'
		);
		expect(paramText).toContain(
			'Name of the control e.g. "play_indicator"\n> (No description)'
		);
		expect(paramText).toContain(
			'> _@deprecated_ since version 2.4.0: Use [Skin],show_samplers instead.'
		);
		expect(paramText).not.toContain(
			'> The [Skin] group contains controls that are used to selective show and hide parts of the graphical user interface of Mixxx to suit your needs.'
		);
		expect(paramText).not.toContain(
			'> Toggle the display of sampler banks in the user interface.'
		);
	});
});
