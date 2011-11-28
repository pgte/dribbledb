(function() {
  function _deepEqual(actual, expected) {
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
      return true;

    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();

    // 7.3. Other pairs that do not both pass typeof value == "object",
    // equivalence is determined by ==.
    } else if (typeof actual != 'object' && typeof expected != 'object') {
      return actual === expected;

    // 7.4. For all other Object pairs, including Array objects, equivalence is
    // determined by having the same number of owned properties (as verified
    // with Object.prototype.hasOwnProperty.call), the same set of keys
    // (although not necessarily the same order), equivalent values for every
    // corresponding key, and an identical "prototype" property. Note: this
    // accounts for both named and indexed properties on Arrays.
    } else {
      return objEquiv(actual, expected);
    }
  }

  function isUndefinedOrNull (value) {
    return value === null || value === undefined;
  }

  function isArguments (object) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
  }

  function objEquiv (a, b) {
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
      return false;
    // an identical "prototype" property.
    if (a.prototype !== b.prototype) return false;
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false;
      }
      a = pSlice.call(a);
      b = pSlice.call(b);
      return _deepEqual(a, b);
    }
    try{
      var ka = Object.keys(a),
        kb = Object.keys(b),
        key, i;
    } catch (e) {//happens when one is a string literal and the other isn't
      return false;
    }
    // having the same number of owned properties (keys incorporates hasOwnProperty)
    if (ka.length != kb.length)
      return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i])
        return false;
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i];
      if (!_deepEqual(a[key], b[key] ))
         return false;
    }
    return true;
  }

  function expect(o1) {
    
    function assert(bool, message) {
      if (! bool) { throw new Error(message); }
    }

    function toBeTrue() {
      assert(_deepEqual(o1, true), 'expected ' + JSON.stringify(o1) + ' to be true ');
    }

    function toEqual(o2) {
      assert(_deepEqual(o1, o2), 'expected ' + JSON.stringify(o1) + ' to equal ' + (JSON.stringify(o2)));
    }
    
    function toNotEqual(o2) {
      assert(! _deepEqual(o1, o2), 'expected ' + JSON.stringify(o1) + ' to not equal ' + (JSON.stringify(o2)));
    }
    
    function toBeDefined() {
      assert('undefined' !== typeof(o1), 'expected ' + JSON.stringify(o1) + ' to be defined');
    }

    function toNotBeDefined() {
      assert('undefined' === typeof(o1), 'expected ' + JSON.stringify(o1) + ' to be undefined');
    }
    
    function toBeNull() {
      assert(o1 === null, 'expected ' + JSON.stringify(o1) + ' to be null');
    }
    
    function toBeNullOrUndefined() {
      assert(o1 === null || typeof(o1) === 'undefined', 'expected ' + JSON.stringify(o1) + ' to be null or undefined');
    }
    
    function toContain(o2) {
      var o, contains = false;
      for(var i in o1) {
        o = o1[i];
        if (_deepEqual(o, o2)) {
          contains = true;
          break;
        }
      }
      assert(contains, 'expected ' + JSON.stringify(o1) + ' to contain ' + JSON.stringify(o2));
    }

    return {
        ok : assert
      , toBeTrue : toBeTrue
      , toEqual : toEqual
      , toNotEqual : toNotEqual
      , toBeDefined : toBeDefined
      , toNotBeDefined : toNotBeDefined
      , toBeNullOrUndefined : toBeNullOrUndefined
      , toBeNull : toBeNull
      , toContain : toContain
    }
  }
  
  this.expect = expect;

}());
