function resolve_storage_strategy(strat_name) {
  var strat;
  if ('function' === typeof(strat_name)) { strat = strat_name; }
  else {
    switch(strat_name) {
      case 'localstore':
        strat = store_strategy_localstore;
      break;
      case 'sessionstore':
        strat = store_strategy_sessionstore;
      break;
      default:
        throw new Error('Unknown store strategy: ' + strat_name);
    }
  }
  return strat;
}