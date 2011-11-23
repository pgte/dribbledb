var root             = this
  , previous_dribble = root.dribbledb
  , STORAGE_NS       = 'dbd'
  , local_store      = store()
  ;

function dribbledb(base_url, options) {