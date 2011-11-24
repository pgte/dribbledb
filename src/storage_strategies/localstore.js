function store_strategy_localstore(base_url) {
  return store_strategy_webstore(base_url, root.localStorage, 'localstore');
}
