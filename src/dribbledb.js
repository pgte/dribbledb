var that
  , sync
  , pull_strategy
  , push_strategy;

options = options || {};

options.pull_strategy = options.pull_strategy || 'couchdb_bulk';
pull_strategy = resolve_pull_strategy(options.pull_strategy) ();

options.push_strategy = options.push_strategy || 'restful_ajax';
push_strategy = resolve_push_strategy(options.push_strategy) ();

function doc_key(id) {
  return global_doc_key(base_url, id);
}

function meta_key(id) {
  return global_meta_key(base_url, id);
}

function since_key() {
  return global_since_key(base_url);
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


// ============================= DB manipulation  ~===

function put(key, value) {
  if (arguments.length < 2) {
    value = key;
    key = value.id || value._id || uuid();
  }
  var uri = doc_key(key);
  local_store.put(uri, value);
  local_store.put(meta_key(key), 'p');
  return key;
}

function remote_put(key, value) {
  var uri = doc_key(key);
  local_store.put(uri, value);
}

function get(key) {
  return local_store.get(doc_key(key));
}

function destroy(key) {
  var meta_value = 'd';
  var old = get(key);
  if (old && old._rev) { meta_value += old._rev; }
  if (local_store.destroy(doc_key(key))) {
    local_store.put(meta_key(key), meta_value);
  }
}

function remote_destroy(key) {
  local_store.destroy(doc_key(key));
}

function all(cb, done) {
  var ret;

  if ('function' !== typeof(cb)) {
    ret = [];
    cb = function(key, value, done) {
      ret.push(value);
      done();
    };
  }
  
  local_store.all_keys_iterator(doc_key(), cb, done);
  return ret;
}

function nuke() {
  local_store.all_keys(doc_key()).forEach(function(key) {
    local_store.destroy(doc_key(key));
  });
  local_store.all_keys(meta_key()).forEach(function(key) {
    local_store.destroy(meta_key(key));
  });
  return true;
}

// ========================================= sync   ~==

function pull(resolveConflicts, cb) {
  pull_strategy(resolveConflicts, cb);
}

function push(resolveConflicts, cb) {
  push_strategy(resolveConflicts, cb);
}

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

    push(resolveConflicts, function(err) {
      if (err) { return error(err); }
      pull(resolveConflicts, function(err) {
        if (err) { return error(err); }
        callback();
      });
    });

  }

  sync.on = function() {
    syncEmitter.on.apply(syncEmitter, arguments);
  };

  return sync;
  
}());

that = {
    sync    : sync
  , put     : put
  , get     : get
  , destroy : destroy
  , unsynced_keys : unsynced_keys
  , all : all
  , nuke : nuke
};

return that;
