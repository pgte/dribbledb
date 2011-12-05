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

  function mem_get(prefix, id, cb) {
    var o = store[full_path(prefix, id)]
      , val = null;
    if ('undefined' !== typeof(o)) { val = clone(o); }
    cb(null, val);
  }

  function mem_put(prefix, id, document, cb) {
    store[full_path(prefix, id)] = clone(document);
    cb(null, id);
  }

  function mem_destroy(prefix, id, cb) {
    delete store[full_path(prefix, id)];
    cb(null);
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
        i += 1;
        iterate();
      }

      key = keys[i];
      key = key.slice(path.length + 1);
      mem_get('d', key, function(err, val) {
        if (err) { return done(err); }
        cb(key, val, next);
      })
    }());
  }

  function mem_all_keys(prefix, cb) {
    var keys = [];
    mem_all_keys_iterator(prefix, function(key, value, done) {
      keys.push(key);
      done();
    });
    cb(null, keys);
  }
  
  function ready(cb) {
    cb();
  }

  return { get     : mem_get
         , put     : mem_put
         , destroy : mem_destroy
         , all_keys_iterator: mem_all_keys_iterator
         , all_keys: mem_all_keys
         , ready: ready
         , stratName: 'memstore'
         };
}