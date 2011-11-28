function store_strategy_webstore(base_url, store, strat_name) {

  function full_path(prefix, id) {
    if (prefix.length != 1) { throw new Error('Invalid prefix: ' + prefix); }
    var path = STORAGE_NS + ':' + prefix + ':' + base_url;
    if ('undefined' !== typeof(id)) {
      path += '/' + id;
    }
    return path;
  }

  function browser_get(prefix, id, cb) {
    if ('function' !== typeof(cb)) { throw new Error('3rd argument must be a function'); }
    var doc = store.getItem(full_path(prefix, id));
    cb(null, JSON.parse(doc));
  }

  function browser_put(prefix, id, document, cb) {
    if ('function' !== typeof(cb)) { throw new Error('3rd argument must be a function'); }
    var key = full_path(prefix, id)
      , doc = JSON.stringify(document);
    store.setItem(key, doc);
    cb();
  }

  function browser_destroy(prefix, id, cb) {
    if ('function' !== typeof(cb)) { throw new Error('3rd argument must be a function'); }
    var path = full_path(prefix, id);
    if (null !== store.getItem(path)) {
      store.removeItem(path);
      return cb(null, true);
    }
    return cb(null, false);
  }

  function browser_all_keys_iterator(prefix, cb, done) {
    var storage = store
      , keys, i = 0
      , path = full_path(prefix);

    done = done || noop;
    
    keys = (function() {
      var key
        , i
        , keys = [];

      for(i = 0; i < storage.length; i ++) {
        key = storage.key(i);
        if (key && 0 === key.indexOf(path)) {
          keys.push(key);
        }
      }
      return keys;
    }());
    
    (function iterate() {
      var key, retKey;

      if (i >= keys.length) { return done(); }

      function next() {
        i ++;
        iterate();
      }

      key = keys[i];
      retKey = key.slice(path.length + 1);
      browser_get(prefix, retKey, function(err, val) {
        if (err) { return done(err); }
        cb(retKey, val, next);
      });
    }());
  }

  function browser_all_keys(prefix, done) {
    var keys = [];
    browser_all_keys_iterator(prefix, function(key, value, next) {
      keys.push(key);
      next();
    }, function(err) {
      if (err) { return done(err); };
      done(null, keys);
    });
  }

  if(! store) { throw new Error('At the moment this only works in modern browsers'); }

  return { get     : browser_get
         , put     : browser_put
         , destroy : browser_destroy
         , all_keys_iterator: browser_all_keys_iterator
         , all_keys: browser_all_keys
         , stratName: strat_name
         };
}