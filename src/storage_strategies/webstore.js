function store_strategy_webstore(store, strat_name) {
  function browser_get(path) {
    var document = store.getItem(path);
    return JSON.parse(document);
  }

  function browser_put(path, document) {
    document = JSON.stringify(document);
    store.setItem(path, document);
  }

  function browser_destroy(path) {
    if (null !== store.getItem(path)) {
      store.removeItem(path);
      return true;
    }
    return false;
  }

  function browser_all_keys_iterator(path, cb, done) {
    var storage = store
      , keys, i = 0;

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
      var key;

      if (i >= keys.length) { return done(); }

      function next() {
        i ++;
        iterate();
      }

      key = keys[i];
      cb(key.slice(path.length + 1), browser_get(key), next);
    }());
  }

  function browser_all_keys(path) {
    var keys = [];
    browser_all_keys_iterator(path, function(key, value, done) {
      keys.push(key);
      done();
    });
    return keys;
  }

  if(! store) {
    throw new Error('At the moment this only works in modern browsers');
  }
  return { get     : browser_get
         , put     : browser_put
         , destroy : browser_destroy
         , all_keys_iterator: browser_all_keys_iterator
         , all_keys: browser_all_keys
         , stratName: strat_name
         };
}