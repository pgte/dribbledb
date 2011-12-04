var stores = {};
function store_strategy_idbstore(base_url) {

  // Singleton for each DB (url)
  if (stores[base_url]) { return stores[base_url]; }

  var store = (function() {

    var DB_VERSION = '1.2';

    var idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var consts = window.IDBTransaction || window.webkitIDBTransaction || window.msIndexedDB;
    var IDBDatabaseException = window.IDBDatabaseException || window.webkitIDBDatabaseException;
    var errorCodes = Object.keys(IDBDatabaseException);
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

    var dbName;
    var db;
    var dbs_enum = ['d', 'm', 's'];

    var stores = {};
    var ready = false;
    var initializing = false;
    var initializationError;

    var readyQueue = [];
    
    function decodeErrorEvent(evt) {
      var code = evt.target.errorCode;
      var message = evt.target.webkitErrorMessage || errorCodes[code].toLowerCase();
      var err = new Error(message);
      err.code = code;
      err.event = evt;
      return err;
    }
    
    function proxyErrorEvent(cb) {
      return function(evt) {
        cb(decodeErrorEvent(evt));
      }
    } 

    function setDBVersion(cb) {
      if (db.version !== DB_VERSION) {
        var versionReq = db.setVersion(DB_VERSION);
        
        versionReq.onerror = versionReq.onblocked = proxyErrorEvent(cb);
        versionReq.onsuccess = function(event) {
          cb();
        }
      } else {
        cb();
      }
    }

    function initializeDB(cb) {
      dbName = STORAGE_NS + '::' + base_url;
      var openRequest = idb.open(dbName, 'DribbleDB', {keyPath: '_id'});
      openRequest.onerror = proxyErrorEvent(cb);
      openRequest.onsuccess = function(event) {
        db = event.target.result;
        setDBVersion(function(err, init) {
          if (err) { return cb(err); }
          var i = -1;
          (function next() {
            var db_name;
            i += 1;
            if (i >= dbs_enum.length) { return cb(); }
            db_name = dbs_enum[i];
            if (db.objectStoreNames.contains(db_name)) {
              var emptyTransaction = db.transaction([], consts.READ_ONLY);
              stores[db_name] = emptyTransaction.objectStore(db_name);
              next();
            } else {
              stores[db_name] = db.createObjectStore(db_name, { keyPath: '_id'});
              next();
            }
          }());
        });
      };
    }

    function onStoreReady(cb) {
      if ('function' !== typeof(cb)) { throw new Error('onStoreReady needs callabck function'); }
      if (ready) {
        cb();
      } else {
        if (! initializing) {
          initializing = true;
          initializeDB(function(err) {
            initializing = false;
            if (err) { initializationError = err; }
            setTimeout(function() {
              ready = true;
              for(var i in readyQueue) {
                readyQueue[i](initializationError);
              }
              cb();
            }, 0);
          });
        } else {
          if (initializationError) { return cb(initializationError); }
          readyQueue.push(cb)
        }
      }
    }

    function idb_get(prefix, id, cb) {
      onStoreReady(function(err) {
        if (err) { return cb(err); }
        var getRequest = db.transaction([prefix], consts.READ_ONLY).objectStore(prefix).get(id);
        getRequest.onsuccess = function(event) {
          // setTimeout(function() {
            cb(null, event.target.result);
          // }, 0);
        };
        getRequest.onerror = proxyErrorEvent(cb);
      });
    }

    function idb_put(prefix, id, value, cb) {
      onStoreReady(function(err) {
        if (err) { return cb(err); }
        value._id || (value._id = id);
        var putRequest = db.transaction([prefix], consts.READ_WRITE).objectStore(prefix).put(value);
        putRequest.onsuccess = function(event) {
          // setTimeout(function() {
            cb(null, event.target.result);
          // }, 0);
        };
        putRequest.onerror = proxyErrorEvent(cb);
      });
    }

    function idb_destroy(prefix, id, cb) {
      onStoreReady(function(err) {
        if (err) { return cb(err); }
        var putRequest = db.transaction([prefix], consts.READ_WRITE).objectStore(prefix).delete(id);
        putRequest.onsuccess = function(event) {
          // setTimeout(function() {
            cb(null, true);
          // }, 0);
        };
        putRequest.onerror = function(evt) {
          if (evt.target.errorCode === 3) {
            return cb(null, false);
          }
          proxyErrorEvent(cb);
        }
      });
    }

    function idb_all_keys_iterator(prefix, cb, done) {
      onStoreReady(function(err) {
        idb_all_keys(prefix, function(err, keys) {
          if (err) { return cb(err); }
          var i = -1;
          (function next() {
            var key;
            i += 1;
            if (i >= keys.length) { return done(); }
            key = keys[i];
            idb_get(prefix, key, function(err, val) {
              if (err) { return cb(err); }
              cb(key, val, next);
            });
          }());
        });
      });
    }


    function idb_all_keys(prefix, cb) {
      onStoreReady(function(err) {
        var keys = [];
        var cursorRequest = db.transaction([prefix], consts.READ_ONLY).objectStore(prefix).openCursor(undefined, IDBCursor.NEXT);
        cursorRequest.onsuccess = function(evt) {
          var result = event.target.result;
          if (! result) { return cb(null, keys); }
          keys.push(result.key);
          result.continue();
        };
        cursorRequest.onerror = proxyErrorEvent(cb);
      });
    }

    return { get     : idb_get
           , put     : idb_put
           , destroy : idb_destroy
           , all_keys_iterator: idb_all_keys_iterator
           , all_keys: idb_all_keys
           , stratName: 'idbstore'
           , ready: onStoreReady
           , internalName: dbName
           };
  }());
  
  stores[base_url] = store;
  return store;
}