(function() {
  var strategies_order = ['localstore', 'sessionstore'];
  var scannableStrategies = {
      'localstore' : function() { return (typeof(window.localStorage) !== 'undefined'); }
    , 'sessionstore': function() { return (typeof(window.sessionStorage) !== 'undefined'); }
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