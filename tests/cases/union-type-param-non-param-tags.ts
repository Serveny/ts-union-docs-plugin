import { Color } from './union-type-param';

/**
 * Paint docs
 *
 * @returns the chosen color
 * @deprecated use another paint function
 */
function paint(color: Color): Color {
	return color;
}

paint('red');
