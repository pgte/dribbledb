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
    exports.dribbledb.store = node_store();
  } 
  else if (typeof define === 'function' && define.amd) {
    define('dribbledb', function() {
      dribbledb.store = browser_store();
      return dribbledb;
    });
  } 
  else {
    dribbledb.store = browser_store();
    root.dribbledb = dribbledb;
  }

  dribbledb.version = '0.0.1';

  function browser_store() {
    if(!root.localStorage) {
      throw new Error('At the moment this only works in modern browsers'); 
    }
    return {};
  }

  function node_store() {
    return {};
  }

})();