function resolve_push_strategy(strat_name) {
  var strat;
  if ('function' === typeof(strat_name)) { strat = strat_name; }
  else {
    switch(strat_name) {
      case 'restful_ajax':
        strat = push_strategy_restful_ajax;
      break;
      default:
        throw new Error('Unknown push strategy: ' + strat_name);
    }
  }
  return strat;
}