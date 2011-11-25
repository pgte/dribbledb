function create_storage(engineConstructor) {
  return function(base_url) {
    var engine = engineConstructor();


    // === keys ~========

    function doc_key(id) {
      return global_doc_key(base_url, id);
    }

    function meta_key(id) {
      return global_meta_key(base_url, id);
    }

    function since_key() {
      return global_since_key(base_url);
    }


    // === data manipulation ~========

    function doc_get(key) { return engine.get(doc_key(key)); }
    function doc_put(key, value) { return engine.put(doc_key(key), value); }
    function doc_destroy(key) { return engine.destroy(doc_key(key)); }
    function meta_get(key) { return engine.get(meta_key(key)); }
    function meta_put(key, value) { return engine.put(meta_key(key), value); }
    function meta_destroy(key) { return engine.destroy(meta_key(key)); }
    function all_doc_keys_iterator(cb, done) { return engine.all_keys_iterator(doc_key(), cb, done); }
    function all_doc_keys() { return engine.all_keys(doc_key()); }
    function all_meta_keys_iterator(cb, done) { return engine.all_keys_iterator(meta_key(), cb, done); }
    function all_meta_keys() { return engine.all_keys(meta_key()); }

    function pulled_since(val) {
      var key = since_key();
      if (! val) {
        return engine.get(key) || 0;
      } else {
        return angine.put(key, val);
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