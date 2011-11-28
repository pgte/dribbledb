function resolve_storage_strategy(strat_name) {
  var strats = {
      'idbstore'     : store_strategy_idbstore
    , 'localstore'   : store_strategy_localstore
    , 'sessionstore' : store_strategy_sessionstore
    , 'memstore'     : store_strategy_memstore
  };
  return create_storage(strats[strat_name]);
}