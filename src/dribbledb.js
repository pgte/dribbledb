var that = new EventEmitter()
  , sync
  , store
  , pull_strategy
  , push_strategy;

options = options || {};


// ====  strategy resolving ~======

options.storage_strategy || (options.storage_strategy = 'localstore');
store = resolve_storage_strategy(options.storage_strategy) (base_url);

options.pull_strategy || (options.pull_strategy = 'couchdb_bulk');
pull_strategy = resolve_pull_strategy(options.pull_strategy) ();

options.push_strategy || (options.push_strategy = 'restful_ajax');
push_strategy = resolve_push_strategy(options.push_strategy) ();

// ============================= DB manipulation  ~===

function unsynced_keys(cb) {
  return store.meta.all_keys(cb);
}

function unsynced_keys_iterator(cb, done) {
  store.meta.all_keys_iterator(cb, done);
}

function pulled_since(val, cb) {
  if (arguments.length < 2) { cb = val; val = undefined; }
  return store.pulled_since(val, cb);
}

function error_callback(err) {
  if (err) { that.emit('error', err); }
}

function put(key, value, callback) {
  if (arguments.length < 3) {
    if ('function' === typeof(value)) {
      callback = value;
      value = key;
      key = value.id || value._id || uuid();
    } else {
      callback = error_callback;
    }
  }
  
  if (! value.id || value._id) { value._id = key; }
  store.doc.put(key, value, function(err) {
    if (err) { return callback(err); }
    store.meta.put(key, 'p', function(err) {
      if (err) { return callback(err); }
      callback(null, key);
    });
  });
  return key;
}

function remote_put(key, value, cb) {
  if (! cb) { cb = error_callback; }
  return store.doc.put(key, value, cb);
}

function get(key, cb) {
  if (! cb) { cb = error_callback; }
  return store.doc.get(key, cb);
}

function destroy(key, cb) {
  var meta_value = 'd';
  get(key, function(err, old) {
    if (err) { return cb(err); }
    if (old && old._rev) { meta_value += old._rev; }
    store.doc.destroy(key, function(err, destroyed) {
      if (err) { return cb(err); }
      if (destroyed) {
        store.meta.put(key, meta_value, cb);
      } else {
        cb();
      }
    });
  });
}

function remote_destroy(key, cb) {
  store.doc.destroy(key, cb);
}

function all(callback) {
  var ret = [];

  function cb(key, value, done) {
    ret.push(value);
    done();
  }
  
  function done(err) {
    if (err) { return callback(err); }
    callback(null, ret);
  }
  
  store.doc.all_keys_iterator(cb, done);
}

function nuke(cb) {
  (function(done) {
    store.doc.all_keys(function(err, keys) {
      if (err) { return cb(err); }
      var key, i = -1;
      (function next() {
        i += 1;
        if (i >= keys.length) {
         return done(); 
        }
        key = keys[i];
        store.doc.destroy(key, function(err) {
          if (err) { return cb(err); }
          next();
        });
      }());
    });
  }(function() {
    store.meta.all_keys(function(err, keys) {
      if (err) { return cb(err); }
      var key, i = -1;
      (function next() {
        i += 1;
        if (i >= keys.length) {
         return cb(); 
        }
        key = keys[i];
        store.meta.destroy(key, function(err) {
          if (err) { return cb(err); }
          next();
        });
      }());
    });
  }));
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
      if (err && ! callback(err)) { syncEmitter.emit('error', err); }
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
