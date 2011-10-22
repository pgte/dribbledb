(function() {
  var root             = this
    , previous_dribble = root.dribbledb
    , dribbledb        = {}
    ;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = dribbledb;
    }
    exports.dribbledb = dribbledb;
    exports.dribbledb.internals = {store: node_store()};
  } 
  else if (typeof define === 'function' && define.amd) {
    define('dribbledb', function() {
      dribbledb.internals = {store: browser_store()};
      return dribbledb;
    });
  } 
  else {
    dribbledb.internals = {store: browser_store()};
    root.dribbledb = dribbledb;
  }

  dribbledb.version = '0.0.1';

  function browser_store() {
    function browser_get(path) {
      var document = root.localStorage.getItem(path);
      try {
        document = JSON.parse(document);
        return document;
      }
      catch (err) {
        return document;
      }
    }

    function browser_put(path,document) {
      if(typeof document === 'object') {
        document = JSON.stringify(document);
      }
      root.localStorage.setItem(path,document);
      return;
    }

    function browser_destroy(path) {
      root.localStorage.removeItem(path);
      return;
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
      return;
    }

    function node_put(path,document) {
      if(typeof document === 'object') {
        document = JSON.stringify(document);
      }
      return;
    }

    function node_destroy(path) {
      return;
    }

    return { get     : node_get
           , put     : node_put
           , destroy : node_delete
           };
  }

})();