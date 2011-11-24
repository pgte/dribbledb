function store_strategy_sessionstore(base_url) {
  return store_strategy_webstore(base_url, root.sessionStorage, 'sessionstore');
}
