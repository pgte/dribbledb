function pull_strategy_couchdb_bulk(base_url, pulled_since, get, put, remote_put, remote_destroy, meta_key) {
  var uri = base_url + '/_changes?since=' + pulled_since() + '&include_docs=true';
  return function(cb) {
    var calledback = false;
    
    function callback() {
      if (! calledback && typeof(cb) === 'function') {
        calledback = true;
        cb.apply(this, arguments);
        return true;
      }
      return false;
    }
    
    function error(err) {
      if (err) {
        if (! callback(err)) {
          syncEmitter.emit('error', err);
        }
        return true;
      }
      return false;
    }
    
    remote_get(uri, function(err, resp) {
        var i, body, results, change, key, theirs, err2, mine;

        if (err) { return error(err); }
        if (! resp.ok) { return cb(new Error('Pull response not ok for URI: ' + uri)); }
        if (! resp.body) { return cb(new Error('Pull response does not have body for URI: ' + uri)); }
        body = resp.body;
        if ('object' !== typeof(body)) { return cb(new Error('Pull response body is not object for URI: ' + uri)); }
        if (! body.hasOwnProperty('last_seq')) {
          err2 = new Error('response body does not have .last_seq: ' + uri);
          err2.body = body;
          return cb(err2);
        }
        if (! body.hasOwnProperty('results')) {
          err2 = new Error('response body does not have .results: ' + uri);
          err2.body = body;
          return cb(err2);
        }

        results = body.results;
        i = -1;

        (function next() {
          i += 1;
          if (i < results.length) {
            change = results[i];
            key = change.id;
            theirs = change.doc;
            if (get(meta_key(key))) {
              if (resolveConflicts) {
                mine = get(doc_key(key));
                resolveConflicts(mine, theirs, function(resolved) {
                  put(key, resolved);
                  next();
                });
              } else {
                err2 = new Error('Conflict');
                err2.key = key;
                err2.mine = mine;
                err2.theirs = theirs;
                error(err2);
                next();
              }
            } else {
              if (change.deleted) { remote_destroy(key); }
              else { remote_put(key, theirs); }

              next();
            }
          } else {
            // finished
            pulled_since(body.last_seq);
            cb();
          }
        }());
      });
  }
};