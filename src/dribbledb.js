(function() {
  var root             = this
    , previous_dribble = root.dribbledb
    , STORAGE_NS       = 'dbd'
    , local_store
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
    
    function browser_all_keys_iterator(final_call, path, cb) {
      var storage = root.localStorage;
      var i = 0, key;
      (function iterate() {
        
        function next() {
          i ++;
          if (i < storage.length) { iterate(); }
          else { if (final_call) { cb(); } }
        }
        
        if (key = storage.key(i)) {
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
      browser_all_keys_iterator(false, path, function(key, value, done) {
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
  
// ============================================================= internals ~==

  // shortcuts
  local_store = browser_store();

  // uri building
  function key(type, base_url) { return STORAGE_NS + ':' + type + ':' + base_url; }
  function global_item_key(type, base_url, id)   {
    if (id !== undefined) {
      base_url += ('/' + id);
    }
    return key(type,  base_url);
  }
  function global_doc_key(base_url, id)   { return global_item_key('d', base_url,  id);  }
  function global_meta_key(base_url, id)   { return global_item_key('m', base_url, id);  }

// ================================================================ public ~==

  function dribbledb(base_url) {
    var that = {}
      , request = superagent
      , put
      , sync;
    
    function doc_key(id) {
      return global_doc_key(base_url, id);
    }  

    function meta_key(id) {
      return global_meta_key(base_url, id);
    }  
    
    function put(key, value) {
      var uri = doc_key(key);
      local_store.put(uri, value);
      local_store.put(meta_key(key), 'p');
    }
    
    function get(key) {
      return local_store.get(doc_key(key));
    }

    function destroy(key) {
      local_store.destroy(doc_key(key));
      local_store.put(meta_key(key), 'd');
    }
    
    function unsynced_keys() {
      return local_store.all_keys(meta_key());
    }
    
    function unsynced_keys_iterator(cb) {
      local_store.all_keys_iterator(true, meta_key(), cb);
    }


    // ========================================= sync   ~==
    sync = (function() {
      var syncEmitter = new EventEmitter();
      
      function sync(resolveConflicts, cb) {
        var calledback = false;
        
        if (arguments.length < 2) { cb = resolveConflicts; resolveConflicts = undefined;}
        
        function callback() {
          if (! calledback && typeof(cb) === 'function') {
            calledback = true;
            cb.apply(that, arguments);
            return true;
          }
          return false;
        }
        
        function error(err) {
          if (err) {
            if (! callback(err)) {
              syncEmitter.emit('error', err);
            }
            return true;
          }
          return false;
        }
        
        unsynced_keys_iterator(function(key, value, done) {
          var method
            , mine = get(key)
            , uri = base_url + '/' + key
            , remoteArgs = [];
          
          if('undefined' === typeof(key)) { // we finished the keys, just call back
            callback();
            return;
          }
          
          local_store.destroy(meta_key(key));
          
          remoteArgs.push(uri);
          method = value === 'p' ? 'put' : (value === 'd' ? 'del' : undefined);
          if (! method) { throw new Error('Invalid meta action: ' + value); }
          if (method === 'put') { remoteArgs.push(mine); }
          
          function handleResponse(err, res) {
            if (err) { return error(err); }
            // ======= conflict! ~==
            if (res.conflict) {
              request.get(uri, function(err, resp) {
                if (err) { return error(err); }
                if (resolveConflicts) {
                  throw new Error('Not implemented yet');
                  resolveConflicts(gugu); // TODO
                } else {
                  err = new Error('Conflict');
                  err.key = key;
                  err.mine = mine;
                  err.theirs = resp.body
                  error(err);
                }
              });
            } else {
              done();
            }
          }
          
          remoteArgs.push(handleResponse);
          request[method].apply(request, remoteArgs);
        });
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
    that.unsynced_keys = unsynced_keys
    
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