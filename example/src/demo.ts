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
	 * Third color
	 *
	 * I'm blue da ba dee
	 */
	| 'blue';

/**
 * logColor docs
 */
function logColor(color: Color, color2: Color): void {
	console.log(color, color2);
}

logColor('red', 'green');

/**
 * Very complex example
 */
type Group = MixxxControls.MixxxGroup;
type Control<TGroup> = MixxxControls.MixxxControl<TGroup>;
type ControlRW<TGroup> = MixxxControls.MixxxControlReadAndWrite<TGroup>;

/**
 * getValue docs
 */
function getValue<TGroup extends Group>(
	group: TGroup,
	name: Control<TGroup>
): number {
	return 0;
}

getValue('[Channel1]', 'cue_mode');

/**
 * Inline union docs function
 */
function test(
	x: /**
	 * Bla docs
	 * */
	| 'bla'
		/**
		 * Blub docs
		 * */
		| 'blub'
) {}

test('bla');
