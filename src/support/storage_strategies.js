(function() {
  var scannableStrategies = {
    'localstore' : detect_localstore
  };
  
  function detect_localstore() {
    return (typeof(window.localStorage) !== 'undefined');
  }
  
  function supportedStorageStrategies() {
    var strategies = []
      , detector;

    for(var strat in scannableStrategies) {
      detector = scannableStrategies[strat];
      if (detector()) { strategies.push(strat); }
    }
    return strategies;
  }
  
  dribbledb.supportedStorageStrategies = supportedStorageStrategies;
}());