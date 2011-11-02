/* dribbledb: simple syncing in javascript
 *
 * copyright 2011 nuno job <nunojob.com> (oO)--',--
 *
 * licensed under the apache license, version 2.0 (the "license");
 * you may not use this file except in compliance with the license.
 * you may obtain a copy of the license at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * unless required by applicable law or agreed to in writing, software
 * distributed under the license is distributed on an "as is" basis,
 * without warranties or conditions of any kind, either express or implied.
 * see the license for the specific language governing permissions and
 * limitations under the license.
 */
(function() {
  var root             = this
    , previous_dribble = root.dribbledb
    , dribbledb        = {internals: {}, fn: {}}
    , STORAGE_NS       = 'dribbledb'
    , jQuery           = window.jQuery
    , fn, store
    ;

// =============================================================== storage ~==
  function inprocess_store() {
    var store = {};
    function inprocess_get(path,cb) { cb(null,store[path]); }
    function inprocess_put(path,document,cb) { store[path] = document; cb(); }
    function inprocess_destroy(path,cb) { delete store[path]; cb(); }
    return { get     : inprocess_get
           , put     : inprocess_put
           , destroy : inprocess_destroy
           };
  }

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
  
  function node_store() {
    function node_get(path,cb) {
      throw Error('Not Implemented');
    }
  
    function node_put(path,document,cb) {
      if(typeof document === 'object') {
        document = JSON.stringify(document);
      }
      throw Error('Not Implemented');
    }
  
    function node_destroy(path,cb) {
      throw Error('Not Implemented');
    }
  
    return { get     : node_get
           , put     : node_put
           , destroy : node_delete
           };
  }


// ============================================================= internals ~==
  function uri(db, path, type) { return STORAGE_NS + ':' + db + ':' + type + ':' + path; }
  function doc_uri(db, path)   { return uri(db,path,'doc');  }
  function meta_uri(db, path)  { return uri(db,path,'meta'); }
  // credit: underscore.js
  function each(obj, iterator, context) {
    if (obj === null) return;
    if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
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
  if (typeof exports !== 'undefined') { // nodejs
    try         { dribbledb.internals.store = node_store();      }
    catch (e) { dribbledb.internals.store = inprocess_store(); }
    dribbledb.fn.request =  require('request');
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = dribbledb;
    }
    exports.dribbledb = dribbledb;
  } else { // browser
    try         { dribbledb.internals.store = browser_store();   }
    catch (exc) { dribbledb.internals.store = inprocess_store(); }
    dribbledb.fn.request = $.request;
    if (typeof define === 'function' && define.amd) {
      define('dribbledb', function() {
        return dribbledb;
      });
    } 
    else {
      root.dribbledb = dribbledb;
    }
  }
  // shortcuts
  fn    = dribbledb.fn;
  store = dribbledb.store;
})();