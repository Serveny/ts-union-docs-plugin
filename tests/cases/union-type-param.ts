/**
 * Available colors
 */
export type Color =
	/**
	 * Primary color
	 */
	| 'red'

	/**
	 * Secondary color with some regex symbols
	 *
	 * @color green
	 */
	| 'green/[.*+?^${}()|[]-]/g'

	// This has no JS doc comment
	| 'blue'

	/**
	 * A number
	 *
	 * @range 1-4
	 */
	| `A${number}`

	/**
	 * Two numbers in one template
	 */
	| `${number}B${number}`;

/**
 * logColor docs
 */
function logColor(color: Color): void {
	console.log(color);
}

logColor('red');
logColor('green/[.*+?^${}()|[]-]/g');
logColor('blue');
logColor('A100');
logColor('1B27');
// @ts-ignore
logColor('');
