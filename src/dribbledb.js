var root             = this
  , previous_dribble = root.dribbledb
  , STORAGE_NS       = 'dbd'
  , local_store
  ;

// ============================================================= internals ~==

// shortcuts
local_store = browser_store();

// ================================================================ public ~==

function dribbledb(base_url) {
  var that = {}
    , sync;
  
  function doc_key(id) {
    return global_doc_key(base_url, id);
  }

  function meta_key(id) {
    return global_meta_key(base_url, id);
  }
  
  function since_key() {
    return global_since_key(base_url);
  }
  
  function put(key, value, remote) {
    var uri = doc_key(key);
    local_store.put(uri, value);
    if (! remote) { local_store.put(meta_key(key), 'p'); }
    
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
  
  function unsynced_keys_iterator(cb, done) {
    local_store.all_keys_iterator(meta_key(), cb, done);
  }
  
  function pulled_since(val) {
    var key = since_key();
    if (! val) {
      return local_store.get(key) || 0;
    } else {
      local_store.put(key, val);
    }
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
      
      // === push to remote ~=============
      function push_one(key, value, done) {
        var method
          , mine = get(key)
          , uri = base_url + '/' + key
          , remoteArgs = [];
        
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
                resolveConflicts(mine, resp.body, function(resolved) {
                  put(key, resolved);
                  push_one(key, value, done);
                });
              } else {
                err = new Error('Conflict');
                err.key = key;
                err.mine = mine;
                err.theirs = resp.body;
                error(err);
              }
            });
          } else {
            local_store.destroy(meta_key(key));
            done();
          }
        }
        
        remoteArgs.push(handleResponse);
        request[method].apply(request, remoteArgs);
      }
      
      // === pull from remote ~=============
      function pull(cb) {
        var uri = base_url + '/_changes?since=' + pulled_since() + '&include_docs=true&force_json=true';
        request
          .get(uri)
          .expectResponseType('json')
          .end(function(err, resp) {
            var i, body, results, change, key, theirs, err2, mine;
          
            if (err) { return error(err); }
            if (! resp.ok) { return cb(new Error('Pull response not ok for URI: ' + uri)); }
            if (! resp.body) { return cb(new Error('Pull response does not have body for URI: ' + uri)); }
            body = resp.body;
            if ('object' !== typeof(body)) { return cb(new Error('Pull response body is not object for URI: ' + uri)); }
            if (! body.hasOwnProperty('last_seq')) {
              err2 = new Error('response body does not have .last_seq: ' + uri);
              err2.body = body;
              return cb(err2);
            }
            if (! body.hasOwnProperty('results')) {
              err2 = new Error('response body does not have .results: ' + uri);
              err2.body = body;
              return cb(err2);
            }

            results = body.results;
            i = -1;

            (function next() {
              i += 1;
              if (i < results.length) {
                change = results[i];
                key = change.id;
                theirs = change.doc;
                if (get(meta_key(key))) {
                  if (resolveConflicts) {
                    mine = get(doc_key(key));
                    resolveConflicts(mine, theirs, function(resolved) {
                      put(key, resolved);
                      next();
                    });
                  } else {
                    err2 = new Error('Conflict');
                    err2.key = key;
                    err2.mine = mine;
                    err2.theirs = theirs;
                    error(err2);
                    next();
                  }
                } else {
                  put(key, theirs, true);
                  next();
                }
              } else {
                // finished
                pulled_since(body.last_seq);
                cb();
              }
            }());
          });
      }
      
      unsynced_keys_iterator(push_one, function() {
        pull(function(err) {
          if (err) { return error(err); }
          callback();
        });
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
  that.unsynced_keys = unsynced_keys;
  
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