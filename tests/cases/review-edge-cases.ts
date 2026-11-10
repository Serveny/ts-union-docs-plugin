type Json = /** json leaf */ 'a' | Json[];
function rec(v: Json) {}
rec('a');

type Size = /** px size */ `${number}.px`;
function size(s: Size) {}
size('12xpx');
size('12.px');
