function store_strategy_memstore(base_url) {
  var store = {};

  function full_path(prefix, id) {
    if (prefix.length > 1) { throw new Error('Invalid prefix: ' + prefix); }
    var path = STORAGE_NS + ':' + prefix + ':' + base_url;
    if ('undefined' !== typeof(id)) {
      path += '/' + id;
    }
    return path;
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function mem_get(prefix, id) {
    var o = store[full_path(prefix, id)];
    if ('undefined' !== typeof(o)) { return clone(o); }
    return null;
  }

  function mem_put(prefix, id, document) {
    store[full_path(prefix, id)] = clone(document);
  }

  function mem_destroy(prefix, id) {
    delete store[full_path(prefix, id)];
  }

  function mem_all_keys_iterator(prefix, cb, done) {
    var storage = store
      , keys, i = 0
      , path = full_path(prefix);

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

  function mem_all_keys(prefix) {
    var keys = [];
    mem_all_keys_iterator(prefix, function(key, value, done) {
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