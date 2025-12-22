import { describe, it, expect } from 'vitest';
import { createProxyFromCase, tagsToText } from './_test_setup';

const { proxy, absolutePath, code } = createProxyFromCase(
	'tests/cases/mixxx-types.ts'
);

describe('Mixxx Types Param Docs Tests', () => {
	it('should find nothing', () => {
		const cursorPos = code.indexOf(`getValue('', '')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);

		expect(result).toBeDefined();
		expect(tagsToText(result!))
			.toBe(`Value of the control (within it's range according Mixxx Controls manual page:
https://manual.mixxx.org/latest/chapters/appendix/mixxx_controls.html)`);
	});

	it('should find gui_tick_50ms_period_s docs', () => {
		const cursorPos = code.indexOf(
			`getValue('[App]', 'gui_tick_50ms_period_s')`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!))
			.toContain(`Name of the control e.g. "play_indicator"
> A throttled timer that provides the time elapsed in seconds since Mixxx was started.
> This control is updated at a rate of 20 Hz (every 50 milliseconds). It is the preferred timer for scripting animations in controller mappings (like VU meters or spinning animations) as it provides a smooth visual result without the performance overhead of [App],gui_tick_full_period_s.
> Only available when using the legacy GUI (not the QML interface).
> 
> 
> _@groups_ [App]
> 
> _@range_ 0.0 .. n
> 
> _@feedback_ None
> 
> _@since_ New in version 2.4.0.
> 
> _@readonly_
> Value of the control (within it's range according Mixxx Controls manual page:
https://manual.mixxx.org/latest/chapters/appendix/mixxx_controls.html)`);
	});

	it('should find beatloop_size docs', () => {
		const cursorPos = code.indexOf(`getValue('[Channel1]', 'beatloop_size')`);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!))
			.toContain(`Name of the control e.g. "play_indicator"
> Set the length of the loop in beats that will get set with
> beatloop_activate and
> beatlooproll_activate.
> Changing this will resize an existing loop if the length of the loop matches
> beatloop_size.
> If the loaded track has no beat grid, seconds are used instead of beats.
> 
> 
> _@groups_ [ChannelN], [PreviewDeckN], [SamplerN]
> 
> _@range_ positive real number
> 
> _@feedback_ Beatloop size spinbox and possibly loop section on waveform
> 
> _@since_ New in version 2.1.0.
> Value of the control (within it's range according Mixxx Controls manual page:
https://manual.mixxx.org/latest/chapters/appendix/mixxx_controls.html)`);
	});

	it('should find pregain_up_small docs', () => {
		const cursorPos = code.indexOf(
			`getValue('[Auxiliary1]', 'pregain_up_small')`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!))
			.toContain(`Name of the control e.g. "play_indicator"
> Adjusts the gain of the input
> This is a ControlPotMeter control.
> 
> 
> _@groups_ [AuxiliaryN], [MicrophoneN]
> 
> _@range_ 0.0..1.0..4.0
> 
> _@feedback_ Microphone gain knob
> 
> _@kind_ pot meter control
> 
> 
> Increases the value by smaller step, sets the speed one small step higher (1 % default)
> Value of the control (within it's range according Mixxx Controls manual page:
https://manual.mixxx.org/latest/chapters/appendix/mixxx_controls.html)`);
	});

	it('should find PeakIndicator1_down_small docs', () => {
		const cursorPos = code.indexOf(
			`getValue('[Auxiliary2]', 'PeakIndicator1_down_small')`
		);
		const result = proxy.getQuickInfoAtPosition(absolutePath, cursorPos);
		expect(result).toBeDefined();
		expect(tagsToText(result!))
			.toContain(`Name of the control e.g. "play_indicator"
> Indicates when the signal is clipping (too loud for the hardware and is being distorted) for the left channel.
> This is a ControlPotMeter control.
> 
> 
> _@groups_ [Master]
> 
> _@range_ binary
> 
> _@feedback_ Clip light (left)
> 
> _@kind_ pot meter control
> Value of the control (within it's range according Mixxx Controls manual page:
https://manual.mixxx.org/latest/chapters/appendix/mixxx_controls.html)`);
	});
});
