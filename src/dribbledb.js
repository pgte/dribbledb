(function() {
  var root             = this
    , previous_dribble = root.dribbledb
    , STORAGE_NS       = 'dribbledb'
    , request, local_store
    ;

// =============================================================== storage ~==
  function browser_store() {
    function browser_get(path) {
      var document = root.localStorage.getItem(path);
      return JSON.parse(document);
    }
  
    function browser_put(path, document) {
      document = JSON.stringify(document);
      root.localStorage.setItem(path, document);
    }
  
    function browser_destroy(path) {
      root.localStorage.removeItem(path);
    }
    
    function browser_all_keys(path) {
      var storage = root.localStorage;
      var i, key, keys = [];
      for(i = 0; i < storage.length; i++) {
        key = storage.key(i);
        if (0 === key.indexOf(path)) {
          keys.push(key.slice(path.length + 1));
        }
      }
      return keys;
    }
  
    if(!root.localStorage) {
      throw new Error('At the moment this only works in modern browsers'); 
    }
    return { get     : browser_get
           , put     : browser_put
           , destroy : browser_destroy
           , all_keys: browser_all_keys
           };
  }
  
// ============================================================= internals ~==

  // shortcuts
  local_store = browser_store();
  request = superagent.request;

  // uri building
  function uri(type, base_url) { return STORAGE_NS + ':' + type + ':' + base_url; }
  function global_item_uri(type, base_url, id)   {
    if (id !== undefined) {
      base_url += ('/' + id);
    }
    return uri(type,  base_url);
  }
  function global_doc_uri(base_url, id)   { return global_item_uri('doc', base_url,  id);  }
  function global_meta_uri(base_url, id)   { return global_item_uri('meta', base_url, id);  }

// ================================================================ public ~==

  function dribbledb(base_url) {
    var that = {}
      , put
      , sync;
    
    function doc_uri(id) {
      return global_doc_uri(base_url, id);
    }  

    function meta_uri(id) {
      return global_meta_uri(base_url, id);
    }  
    
    function put(key, value) {
      var uri = doc_uri(key);
      local_store.put(uri, value);
      local_store.put(meta_uri(key), true);
    }
    
    function get(key) {
      return local_store.get(doc_uri(key));
    }

    function destroy(key) {
      local_store.destroy(doc_uri(key));
    }
    
    function unsynced() {
      return local_store.all_keys(meta_uri());
    }


    // ========================================= sync   ~==
    sync = (function() {
      function sync(cb) {
        // TODO
      }

      sync.on = function() {
        syncEmitter.on.apply(syncEmitter, arguments);
      };
      sync.emit = function() {
        syncEmitter.emit.apply(syncEmitter, arguments);
      };
      
      return sync;
    }());
    
    that.sync = sync;
    that.put = put;
    that.get = get;
    that.destroy = destroy;
    that.unsynced = unsynced;
    
    return that;
  }
  

// =============================================================== exports ~==
  dribbledb.version = '@VERSION';
  if ('function' === typeof(define) && define.amd) {
    define('dribbledb', function() {
      return dribbledb;
    });
  } 
  else {
    root.dribbledb = dribbledb;
  }
  // shortcuts
  fn    = dribbledb.fn;
  store = dribbledb.store;
}());