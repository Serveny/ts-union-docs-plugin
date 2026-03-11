export type DeprecatedColor =
	/**
	 * Legacy red option.
	 *
	 * @deprecated Use "blue"
	 *   instead.
	 */
	| 'red'

	/**
	 * Current blue option.
	 */
	| 'blue';

export function paint(color: DeprecatedColor): void {
	console.log(color);
}

paint('red');
paint('blue');
// @ts-ignore
paint('');

const deprecatedColor: DeprecatedColor = 'red';
// @ts-ignore
const completionColor: DeprecatedColor = '';

console.log(deprecatedColor, completionColor);
