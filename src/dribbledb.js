var that = {}
  , sync
  , store
  , pull_strategy
  , push_strategy;

options = options || {};


// ====  strategy resolving ~======

options.storage_strategy = options.storage_strategy || 'localstore';
store = resolve_storage_strategy(options.storage_strategy) (base_url);

options.pull_strategy = options.pull_strategy || 'couchdb_bulk';
pull_strategy = resolve_pull_strategy(options.pull_strategy) ();

options.push_strategy = options.push_strategy || 'restful_ajax';
push_strategy = resolve_push_strategy(options.push_strategy) ();


// ============================= DB manipulation  ~===

function unsynced_keys() {
  return store.all_meta_keys();
}

function unsynced_keys_iterator(cb, done) {
  store.all_meta_keys_iterator(cb, done);
}

function pulled_since(val) {
  return store.pulled_since();
}

function put(key, value) {
  if (arguments.length < 2) {
    value = key;
    key = value.id || value._id || uuid();
  }
  if (! value.id || value._id) { value._id = key; }
  store.doc_put(key, value);
  store.meta_put(key, 'p');
  return key;
}

function remote_put(key, value) {
  return store.doc_put(key, value);
}

function get(key) {
  return store.doc_get(key);
}

function destroy(key) {
  var meta_value = 'd';
  var old = get(key);
  if (old && old._rev) { meta_value += old._rev; }
  if (store.doc_destroy(key)) {
    store.meta_put(key, meta_value);
  }
}

function remote_destroy(key) {
  store.doc_destroy(key);
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
  
  store.all_doc_keys_iterator(cb, done);
  return ret;
}

function nuke() {
  store.all_doc_keys().forEach(function(key) {
    store.doc_destroy(key);
  });
  store.all_meta_keys().forEach(function(key) {
    store.meta_destroy(key);
  });
  return true;
}

// ======================= sync   ~==

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

that.storageStrategy = store.stratName;
that.sync          = sync;
that.put           = put;
that.get           = get;
that.destroy       = destroy;
that.unsynced_keys = unsynced_keys;
that.all           = all;
that.nuke          = nuke;

return that;
