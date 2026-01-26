import { Color } from './union-type-param';

class ColorPalette {
	// No JS Doc comments
	// @ts-ignore
	public colorNothing: Color = '';
	public colorBlue: Color = 'blue';

	// With JS Doc comments
	public colorRed: Color = 'red';
	public colorGreen: Color = 'green/[.*+?^${}()|[]-]/g';
	public colorTemplate: Color = '32B232423';

	print() {
		console.log(
			this.colorNothing,
			this.colorBlue,
			this.colorRed,
			this.colorGreen,
			this.colorTemplate
		);
	}
}

// Constructor test
class VariableColorPalette {
	// No JS Doc comments

	constructor(
		public color1: Color,

		// With JS Doc comments
		public color2: Color,
		public color3: Color,
		public color4: Color
	) {}
}

const palette = new VariableColorPalette('blue', 'red', 'A2', '324B3324');
