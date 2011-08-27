var EXPORTED_SYMBOLS = [
    'properties_all',
    'inArray',
    'min'
];

function properties_all () {
    var s = '[';
    for (var x in this) {
        if (this[x] instanceof Function) {
            continue;
        }
        s += x + ': ' + this[x] + '\n';
    }
    return s + ']';
}

/*
 * Return true if item is a member of array arr.
 */
function inArray (item, arr) {
    return arr.indexOf(item) !== -1;
    /*for (var i=0; i < arr.length; i++) {
        if (arr[i] == item) {
            return true;
        }
    }
    return false;*/
}

function min (a,b) {
    return (a < b) ? a : b;
}
