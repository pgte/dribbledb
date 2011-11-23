function resolve_pull_strategy(strat_name) {
  var strat;
  if ('function' === typeof(strat_name)) { strat = strat_name; }
  else {
    switch(strat_name) {
      case 'couchdb_bulk':
        strat = pull_strategy_couchdb_bulk;
      break;
      default:
        throw new Error('Unknown pull strategy: ' + strat_name);
    }
  }
  return strat;
}