function store_strategy_idbtore(base_url) {
  
  
  
  function idb_get(path) {
    
  }
  
  return { get     : idb_get
         , put     : idb_put
         , destroy : idb_destroy
         , all_keys_iterator: idb_all_keys_iterator
         , all_keys: idb_all_keys
         , stratName: 'idb'
         };
}