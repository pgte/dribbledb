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

    function doc_get(key) { return engine.get(DOC_PREFIX, key); }
    function doc_put(key, value) { return engine.put(DOC_PREFIX, key, value); }
    function doc_destroy(key) { return engine.destroy(DOC_PREFIX, key); }
    function meta_get(key) { return engine.get(META_PREFIX, key); }
    function meta_put(key, value) { return engine.put(META_PREFIX, key, value); }
    function meta_destroy(key) { return engine.destroy(META_PREFIX, key); }
    function all_doc_keys_iterator(cb, done) { return engine.all_keys_iterator(DOC_PREFIX, cb, done); }
    function all_doc_keys() { return engine.all_keys(DOC_PREFIX); }
    function all_meta_keys_iterator(cb, done) { return engine.all_keys_iterator(META_PREFIX, cb, done); }
    function all_meta_keys() { return engine.all_keys(META_PREFIX); }

    function pulled_since(val) {
      if (! val) {
        return engine.get(SINCE_PREFIX) || 0;
      } else {
        return angine.put(SINCE_PREFIX, undefined, val);
      }
    }

    return {
        stratName      : engine.stratName
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
    }
  }
}