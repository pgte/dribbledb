(function() {
  var root             = this
    , previous_dribble = root.dribbledb
    , dribbledb        = {internals: {}, fn: {}}
    , STORAGE_NS       = 'dribbledb'
    , fn, store
    ;

// =============================================================== storage ~==
  function browser_store() {
    function browser_get(path,cb) {
      var document = root.localStorage.getItem(path);
      try {
        document = JSON.parse(document);
        return cb(null,document);
      }
      catch (err) {
        return cb(null,document);
      }
    }
  
    function browser_put(path,document,cb) {
      try {
        if(typeof document === 'object') {
          document = JSON.stringify(document);
        }
        root.localStorage.setItem(path,document);
        return cb();
      }
      catch (err) {
        cb(err);
      }
    }
  
    function browser_destroy(path,cb) {
      root.localStorage.removeItem(path);
      return cb();
    }
  
    if(!root.localStorage) {
      throw new Error('At the moment this only works in modern browsers'); 
    }
    return { get     : browser_get
           , put     : browser_put
           , destroy : browser_destroy
           };
  }
  
// ============================================================= internals ~==
  function uri(db, path, type) { return STORAGE_NS + ':' + db + ':' + type + ':' + path; }
  function doc_uri(db, path)   { return uri(db,path,'doc');  }
  function meta_uri(db, path)  { return uri(db,path,'meta'); }
  // credit: underscore.js
  function each(obj, iterator, context) {
    var i, key;
    
    if (obj === null) { return; }
    if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  }

// ================================================================ public ~==

  dribbledb.version = '0.0.1';
  // credit: underscore js
  dribbledb.fn.extend = function(obj) {
      each(Array.prototype.slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (source[prop] !== void 0) obj[prop] = source[prop];
        }
      });
      return obj;
    };

  // fixme: put should save metadata  created_at, updated_at, etag
  dribbledb.sync = function dribble_sync(params, cb) {
    cb = (typeof cb === 'function') ? cb : function(){};
    if(typeof params === 'string') { params = {uri: params}; } // if string its a uri
    if(typeof params !== 'object') { return cb(new Error('no_params')); }
    var defaults =
        { on_start    : function(){}
        , on_end      : function(){}
        , before_save : function(){}
        , after_save  : function(){}
        , notify      : function(){}
        }
      , settings = fn.extend({},defaults,params);
    try {
      settings.on_start();
      if(typeof settings.uri !== 'string') { throw new Error('invalid_resource'); }
      fn.request.get(settings.uri, function (err,h,server_copy) {
        if(err) { return cb(err); }
        // if its a 409, conflict
        var local_copy = settings.local; //|| dribbledb.get(settings.uri);
        if(local_copy) {
          merge(local_copy,server_copy);
        } else {
          // update local copy
          cb(null,b,h);
        }
      });
        // try getting it from internal using the resource key
          // if successful do merge with that
        // might still be undefined after this step
          // then just get it and put it in internal memory
      // on success you update locally stored value
    } 
    catch (exc) { cb(exc); }
    finally     { settings.on_end(); }
  };

// =============================================================== exports ~==
  dribbledb.internals.store = browser_store();
  dribbledb.fn.request = superagent.request;
  if (typeof define === 'function' && define.amd) {
    define('dribbledb', function() {
      return dribbledb;
    });
  } 
  else {
    root.dribbledb = dribbledb;
  }
  // shortcuts
  fn    = dribbledb.fn;
  store = dribbledb.store;
})();