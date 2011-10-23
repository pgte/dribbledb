(function() {
  var root             = this
    , previous_dribble = root.dribbledb
    , dribbledb        = {}
    , TIMESTAMPS       = '/_internals/timestamps'
    , IINDEX           = '/_internals/inverted-index'
    , STORAGE_NS       = '/dribbledb/'
    ;

  function browser_store() {
    function browser_get(path,cb) {
      var document = root.localStorage.getItem(path);
      try {
        document = JSON.parse(document);
        return cb(null,document);
      }
      catch (err) {
        return cb(null,document);
      }
    }
  
    function browser_put(path,document,cb) {
      if(typeof document === 'object') {
        document = JSON.stringify(document);
      }
      root.localStorage.setItem(path,document);
      return cb();
    }
  
    function browser_destroy(path,cb) {
      root.localStorage.removeItem(path);
      return cb();
    }
  
    if(!root.localStorage) {
      // Don't like it? Fork it and send in a pull request.
      throw new Error('At the moment this only works in modern browsers'); 
    }
    return { get     : browser_get
           , put     : browser_put
           , destroy : browser_destroy
           };
  }
  
  function node_store() {
    function node_get(path) {
      throw Error('Not Implemented');
    }
  
    function node_put(path,document) {
      if(typeof document === 'object') {
        document = JSON.stringify(document);
      }
      throw Error('Not Implemented');
    }
  
    function node_destroy(path) {
      throw Error('Not Implemented');
    }
  
    return { get     : node_get
           , put     : node_put
           , destroy : node_delete
           };
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = dribbledb;
    }
    exports.dribbledb = dribbledb;
    exports.dribbledb.internals = { store: node_store() };
  } 
  else if (typeof define === 'function' && define.amd) {
    define('dribbledb', function() {
      dribbledb.internals = { store: browser_store() };
      return dribbledb;
    });
  } 
  else {
    dribbledb.internals = {store: browser_store()};
    root.dribbledb = dribbledb;
  }

  dribbledb.version = '0.0.1';
  //dribbledb.put = function dribble_put(database, path, document, params, cb) {
  //  var directory   = extract_directory(path)
  //    , collections = params.collections ? params.collections : []
  //    , user        = params.user
  //    , revision    = params.revision
  //    , uri         = STORAGE_NS + database + '/' + path
  //    ;
  //  dribbledb.internals.timestamp(
  //    function (ts) {
  //      dribbledb.internals.current_document_revision(uri,
  //        function(current_rev) {
  //          if(current_rev > revision) {
  //            return cb(new Error('conflict'));
  //        }
  //      });
  //  });
  //};
})();