function store_strategy_idbstore(base_url) {
  
  var idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
  var db = idb.open(STORAGE_NS);
  var dbs_enum = ['d', 'm', 's'];
  
  var stores = {};
  (function() {
    var dbName;
    for (var i in dbs_enum) {
      dbName = dbs_enum[i];
      stores[dbName] = db.createObjectStore(dbName + ':' + base_url)
    }
  }());
  
  function idb_get(prefix, id) {
    stores[prefix].get(id);
  }
  
  function idb_put(prefix, id, value) {
    stores[prefix].add(value, id);
  }
  
  function idb_destroy(prefix, id) {
    stores[prefix].delete(id);
  }
  
  function idb_all_keys_iterator(prefix, cb, done) {
    var val;
    stores[prefix].openCursor();
    function next() {
      if (! cursor.continue()) {
        done();
      } else {
        val = cursor.value;
        cb(val.id, val, next);
      }
    }
  }
  
  
  function idb_all_keys(prefix) {
    var keys = [];
    browser_all_keys_iterator(prefix, function(key, value, done) {
      keys.push(key);
      done();
    });
    return keys;
  }
  
  return { get     : idb_get
         , put     : idb_put
         , destroy : idb_destroy
         , all_keys_iterator: idb_all_keys_iterator
         , all_keys: idb_all_keys
         , stratName: 'idbstore'
         };
}