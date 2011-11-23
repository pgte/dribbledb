// function key(base_url, type) { return STORAGE_NS + ':' + base_url + ':' + type; }
function key(base_url, type) { return STORAGE_NS + ':' + type + ':' + base_url; }
function global_item_key(base_url, type, id)   {
  if (id !== undefined) {
    base_url += ('/' + id);
  }
  return key(base_url, type);
}
function global_doc_key(base_url, id)   { return global_item_key(base_url, 'd',  id);  }
function global_meta_key(base_url, id)   { return global_item_key(base_url, 'm', id);  }
function global_since_key(base_url)   { return global_item_key(base_url, 's');  }