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

type Group = MixxxControls.MixxxGroup;
type Control<TGroup> = MixxxControls.MixxxControl<TGroup>;
type ControlRW<TGroup> = MixxxControls.MixxxControlReadAndWrite<TGroup>;

function getValue<TGroup extends Group>(group: TGroup, name: Control<TGroup>): number { return 0; }

getValue("[Master]", "PeakIndicator")