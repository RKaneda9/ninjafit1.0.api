module.exports = {
    rand: length => Math.random().toString(36).substring(2, length || 25),

    foreach: (array, callback) => {

        if (!array) { return; }

        var keys = Object.keys(array);

        for (var i = 0; i < keys.length; i++) {
            if (callback(array[keys[i]], i, keys[i]) === false) {
                return i;
            }
        }
    },

    first: (array, func, defVal) => {

        if (!(array instanceof Array)) { return defVal; }

        var keys = Object.keys(array);

        for (var i = 0; i < keys.length; i++) {
            if (func(array[keys[i]], i)) {
                return array[keys[i]];
            }
        }

        return defVal;
    },

    map: (array, func) => {

        if (typeof array != 'object') { return []; }

        var mapped, keys, val;

        mapped = [];
        keys   = Object.keys(array);

        for (var i = 0; i < keys.length; i++) {
            var val = func(array[keys[i]], keys[i], i);
            if (val) { mapped.push(val); }
        }

        return mapped;
    },

    mapObject: (obj, func) => {

        var mapped = {};

        if (!(obj instanceof Object)) { return mapped; }

        var keys = Object.keys(obj);

        for (var i = 0; i < keys.length; i++) {
            if (func(mapped, obj[keys[i]], keys[i], i) === false) {
                break;
            }
        }

        return mapped;
    }
};