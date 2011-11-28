function push_strategy_restful_ajax() {
  
  return function(resolveConflicts, cb) {
    var calledback = false;
    
    function push_one(key, value, done) {
      var method
        , op = value.charAt(0)
        , rev = value.substr(1)
        , uri = base_url + '/' + key;

      method = op === 'p' ? 'put' : (op === 'd' ? 'del' : undefined);
      if (! method) { throw new Error('Invalid meta action: ' + value); }
      if (rev) { uri += '?rev=' + rev; }

      get(key, function(err, mine) {
          function handleResponse(err, res) {
            if (err) { return cb(err); }

            // ======= conflict! ~==

            if (res.conflict) {
              remote_get(uri, function(err, resp) {
                if (err) { return cb(err); }
                if (resolveConflicts) {
                  resolveConflicts(mine, resp.body, function(resolved) {
                    put(key, resolved);
                    push_one(key, value, done);
                  });
                } else {
                  err = new Error('Conflict');
                  err.key = key;
                  err.mine = mine;
                  err.theirs = resp.body;
                  return cb(err);
                }
              });
            } else {
              if (('del' !== method || ! res.notFound) && ! res.ok) { return cb(new Error(method + ' ' + uri + ' failed with response status ' + res.status + ': ' + res.text)); }
              store.meta.destroy(key, function(err) {
                if (err) { return cb(err); }
                done();
              });
            }
          }

          remote(method, uri, mine, handleResponse);
        
      });
    }
    unsynced_keys_iterator(push_one, cb);
  }
}
