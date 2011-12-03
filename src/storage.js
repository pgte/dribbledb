// === keys ~========

function item_key(type, id)   {
  var str = type;
  if (id !== undefined) {
    str += ('/' + id);
  }
  return str;
}
var DOC_PREFIX = 'd';
var META_PREFIX = 'm';
var SINCE_PREFIX = 's';

function create_storage(engineConstructor) {
  return function(base_url) {
    var engine = engineConstructor(base_url);


    // === data manipulation ~========

    function doc_get(key, cb) { return engine.get(DOC_PREFIX, key, cb); }
    function doc_put(key, value, cb) { return engine.put(DOC_PREFIX, key, value, cb); }
    function doc_destroy(key, cb) { return engine.destroy(DOC_PREFIX, key, cb); }
    function meta_get(key, cb) { return engine.get(META_PREFIX, key, cb); }
    function meta_put(key, value, cb) { return engine.put(META_PREFIX, key, value, cb); }
    function meta_destroy(key, cb) { return engine.destroy(META_PREFIX, key, cb); }
    function all_doc_keys_iterator(cb, done) { return engine.all_keys_iterator(DOC_PREFIX, cb, done); }
    function all_doc_keys(cb) { return engine.all_keys(DOC_PREFIX, cb); }
    function all_meta_keys_iterator(cb, done) { return engine.all_keys_iterator(META_PREFIX, cb, done); }
    function all_meta_keys(cb) { return engine.all_keys(META_PREFIX, cb); }

    function pulled_since(val, cb) {
      if ('function' !== typeof(cb)) { throw new Error('2nd argument must be a function'); }
      if (! val) {
        engine.get(SINCE_PREFIX, undefined, function(err, val) {
          if (err) { return cb(err); }
          cb(null, val || 0);
        });
      } else {
        return engine.put(SINCE_PREFIX, undefined, val, cb);
      }
    }

    return {
        stratName      : engine.stratName
      , internalName   : engine.internalName
      , doc : {
            get        : doc_get
          , put        : doc_put
          , destroy    : doc_destroy
          , all_keys_iterator : all_doc_keys_iterator
          , all_keys   : all_doc_keys
        }
      , meta : {
          get       : meta_get
        , put       : meta_put
        , destroy   : meta_destroy
        , all_keys_iterator : all_meta_keys_iterator
        , all_keys  : all_meta_keys
      }
      , pulled_since   : pulled_since
      , ready: engine.ready
    }
  }
}