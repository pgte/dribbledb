(function() {
  var strategies_order = ['idbstore', 'localstore', 'sessionstore', 'memstore'];
  var scannableStrategies = {
      idbstore   : function() { return 'undefined' !== typeof(window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB); }
    , localstore   : function() { return (typeof(window.localStorage) !== 'undefined'); }
    , sessionstore : function() { return (typeof(window.sessionStorage) !== 'undefined'); }
    , memstore     : function() { return true; }
  };
  
  function supportedStorageStrategies() {
    var strategies = []
      , detector
      , strat;

    for(strat in strategies_order) {
      strat = strategies_order[strat];
      detector = scannableStrategies[strat];
      if (detector()) { strategies.push(strat); }
    }
    return strategies;
  }
  
  dribbledb.supportedStorageStrategies = supportedStorageStrategies;
}());