/**
 * Inline union docs function
 */
function testFn(
	x: /**
	 * foo docs
	 * */
	| 'foo'
		/**
		 * bar docs
		 * */
		| 'bar'
		| 'baz'
) {}

/**
 * foo test
 */
testFn('foo');

/**
 * bar test
 */
testFn('bar');

/**
 * baz test
 */
testFn('baz');

// @ts-ignore
testFn('');
