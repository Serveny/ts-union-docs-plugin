/**
 * Available colors
 */
type Color =
	/**
	 * Primary color
	 */
	| 'red'
	/**
	 * Secondary color
	 */
	| 'green'
	/**
	 * Accent color
	 */
	| 'blue';

/**
 * Const test
 */
const color: Color = 'red';

/**
 * function test
 */
function logColor(color: Color): void {
	console.log(color);
}

logColor('green');
