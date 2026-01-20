import { Color } from './union-type-param';

class ColorPalette {
	// @ts-ignore
	public colorNothing: Color = '';
	public colorBlue: Color = 'blue';
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
