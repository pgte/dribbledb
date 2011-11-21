// =============================================================== storage ~==
function store() {
  function browser_get(path) {
    var document = root.localStorage.getItem(path);
    return JSON.parse(document);
  }

  function browser_put(path, document) {
    document = JSON.stringify(document);
    root.localStorage.setItem(path, document);
  }

  function browser_destroy(path) {
    if (null !== root.localStorage.getItem(path)) {
      root.localStorage.removeItem(path);
      return true;
    }
    return false;
  }

  function browser_all_keys_iterator(path, cb, done) {
    var storage = root.localStorage;
    var i = 0, key;
    (function iterate() {

      function next() {
        i ++;
        if (i < storage.length) { iterate(); }
        else { if (done) { done(); } }
      }
      key = storage.key(i);
      if (key) {
        if (0 === key.indexOf(path)) {
          cb(key.slice(path.length + 1), browser_get(key), next);
        } else {
          next();
        }
      }
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

  if(!root.localStorage) {
    throw new Error('At the moment this only works in modern browsers');
  }
  return { get     : browser_get
         , put     : browser_put
         , destroy : browser_destroy
         , all_keys_iterator: browser_all_keys_iterator
         , all_keys: browser_all_keys
         };
}
