type Brightness = 'dark' | 'bright';
type Color = 'red' | `red-${Brightness}` | `red-${number}`;

// ===================
// Test 1
// ===================

function logColor(color: Color) {
	console.log(color);
}

logColor('red');

const color: Color = 'red';

// ===================
// Test 2
// ===================

type PrettyColor = `Pretty-${Color}`;

function logPrettyColor(color: PrettyColor) {
	console.log(color);
}

logPrettyColor('Pretty-red');

const prettyColor: PrettyColor = 'Pretty-red';

// ===================
// Test 3
// ===================

type PrettyNColor = `Pretty-${number}-${Color}`;

function logPrettyNColor(color: PrettyNColor) {
	console.log(color);
}

logPrettyNColor('Pretty-1-red');

const prettyNColor: PrettyNColor = 'Pretty-1-red';
