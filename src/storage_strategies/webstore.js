function store_strategy_webstore(base_url, store, strat_name) {

  function full_path(prefix, id) {
    if (prefix.length != 1) { throw new Error('Invalid prefix: ' + prefix); }
    var path = STORAGE_NS + ':' + prefix + ':' + base_url;
    if ('undefined' !== typeof(id)) {
      path += '/' + id;
    }
    return path;
  }

  function browser_get(prefix, id) {
    var doc = store.getItem(full_path(prefix, id));
    return JSON.parse(doc);
  }

  function browser_put(prefix, id, document) {
    var key = full_path(prefix, id)
      , doc = JSON.stringify(document);
    store.setItem(key, doc);
  }

  function browser_destroy(prefix, id) {
    var path = full_path(prefix, id);
    if (null !== store.getItem(path)) {
      store.removeItem(path);
      return true;
    }
    return false;
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
      var key, retKey, val;

      if (i >= keys.length) { return done(); }

      function next() {
        i ++;
        iterate();
      }

      key = keys[i];
      retKey = key.slice(path.length + 1);
      val = browser_get(prefix, retKey)
      cb(retKey, val, next);
    }());
  }

  function browser_all_keys(prefix) {
    var keys = [];
    browser_all_keys_iterator(prefix, function(key, value, done) {
      keys.push(key);
      done();
    });
    console.log('browser_all_keys:', keys);
    return keys;
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