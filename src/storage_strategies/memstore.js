function store_strategy_memstore() {
  var store = {};

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function mem_get(path) {
    var o = store[path];
    if ('undefined' !== typeof(o)) { return clone(o); }
    return null;
  }

  function mem_put(path, document) {
    store[path] = clone(document);
  }

  function mem_destroy(path) {
    delete store[path];
  }

  function mem_all_keys_iterator(path, cb, done) {
    var storage = store
      , keys, i = 0;

    done = done || noop;

    keys = (function() {
      var key
        , keys = [];

      for(key in store) {
        if (key && 0 === key.indexOf(path)) {
          keys.push(key);
        }
      }
      return keys;
    }());

    (function iterate() {
      var key;

      if (i >= keys.length) { return done(); }

      function next() {
        i ++;
        iterate();
      }

      key = keys[i];
      cb(key.slice(path.length + 1), mem_get(key), next);
    }());
  }

  function mem_all_keys(path) {
    var keys = [];
    mem_all_keys_iterator(path, function(key, value, done) {
      keys.push(key);
      done();
    });
    return keys;
  }

  return { get     : mem_get
         , put     : mem_put
         , destroy : mem_destroy
         , all_keys_iterator: mem_all_keys_iterator
         , all_keys: mem_all_keys
         , stratName: 'memstore'
         };
}