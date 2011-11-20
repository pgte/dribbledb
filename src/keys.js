function key(type, base_url) { return STORAGE_NS + ':' + type + ':' + base_url; }
function global_item_key(type, base_url, id)   {
  if (id !== undefined) {
    base_url += ('/' + id);
  }
  return key(type,  base_url);
}
function global_doc_key(base_url, id)   { return global_item_key('d', base_url,  id);  }
function global_meta_key(base_url, id)   { return global_item_key('m', base_url, id);  }
function global_since_key(base_url)   { return global_item_key('s', base_url);  }