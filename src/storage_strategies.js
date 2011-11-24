function resolve_storage_strategy(strat_name) {
  var strats = {
      'localstore'   : store_strategy_localstore
    , 'sessionstore' : store_strategy_sessionstore
    , 'memstore'     : store_strategy_memstore
  };
  return strats[strat_name];
}