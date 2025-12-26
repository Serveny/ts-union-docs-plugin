import { Color } from './union-type-param';

// @ts-ignore
const constNothing: Color = '';

/**
 * Const blue test
 */
const constBlue: Color = 'blue';

/**
 * Const red test
 */
const constRed: Color = 'red';

/**
 * Const green test
 */
const constGreen: Color = 'green/[.*+?^${}()|[]-]/g';

console.log(constNothing, constBlue, constRed, constGreen);
