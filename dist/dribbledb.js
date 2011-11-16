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
 *
 * VERSION: 0.1.0
 * BUILD DATE: Wed Nov 2 20:57:00 2011 +0000
 */
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * EventEmitter.
 */

function EventEmitter() {
  this.callbacks = {};
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 */

EventEmitter.prototype.on = function(event, fn){
  (this.callbacks[event] = this.callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 */

EventEmitter.prototype.emit = function(event){
  var args = slice.call(arguments, 1)
    , callbacks = this.callbacks[event]
    , i;

  if (callbacks) {
    for (i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i](args);
    }
  }

  return this;
};

/*!
 * superagent
 * Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var superagent = (function(exports){
  
  /**
   * Expose the request function.
   */
  
  exports = request;

  /**
   * Library version.
   */

  exports.version = '0.1.1';

  /**
   * Noop.
   */

  var noop = function(){};

  /**
   * Determine XHR.
   */

  function getXHR() {
    if (window.XMLHttpRequest
      && ('file:' !== window.location.protocol || !window.ActiveXObject)) {
      return new XMLHttpRequest();
    } else {
      try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e1) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e2) {}
      try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e3) {}
    }
    return false;
  }

  /**
   * Removes leading and trailing whitespace, added to support IE.
   *
   * @param {String} s
   * @return {String}
   * @api private
   */

  var trim = ''.trim
    ? function(s) { return s.trim(); }
    : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

 /**
  * Check if `obj` is a function.
  *
  * @param {Mixed} obj
  * @return {Boolean}
  * @api private
  */
  
  function isFunction(obj) {
    return 'function' === typeof obj;
  }

  /**
   * Check if `obj` is an object.
   *
   * @param {Object} obj
   * @return {Boolean}
   * @api private
   */

  function isObject(obj) {
    if (null === obj) { return false; }
    var cons = obj.constructor;
    return cons && Object === cons;
  }

  /**
   * Serialize the given `obj`.
   *
   * @param {Object} obj
   * @return {String}
   * @api private
   */

  function serialize(obj) {
    var key;
    
    if (!isObject(obj)) { return obj; }
    var pairs = [];
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        pairs.push(encodeURIComponent(key)
          + '=' + encodeURIComponent(obj[key]));
      }
    }
    return pairs.join('&');
  }

  /**
   * Expose serialization method.
   */

   exports.serializeObject = serialize;

   /**
    * Parse the given x-www-form-urlencoded `str`.
    *
    * @param {String} str
    * @return {Object}
    * @api private
    */

  function parseString(str) {
    var obj = {}
      , pairs = str.split('&')
      , parts
      , pair
      , i;

    for (i = 0, len = pairs.length; i < len; ++i) {
      pair = pairs[i];
      parts = pair.split('=');
      obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }

    return obj;
  }

  /**
   * Expose parser.
   */

  exports.parseString = parseString;

  /**
   * Default MIME type map.
   * 
   *     superagent.types.xml = 'application/xml';
   * 
   */

  exports.types = {
      html: 'text/html'
    , json: 'application/json'
    , urlencoded: 'application/x-www-form-urlencoded'
    , 'form-data': 'application/x-www-form-urlencoded'
  };

  /**
   * Default serialization map.
   * 
   *     superagent.serialize['application/xml'] = function(obj){
   *       return 'generated xml here';
   *     };
   * 
   */

   exports.serialize = {
       'application/x-www-form-urlencoded': serialize
     , 'application/json': JSON.stringify
   };

   /**
    * Default parsers.
    * 
    *     superagent.parse['application/xml'] = function(str){
    *       return { object parsed from str };
    *     };
    * 
    */

  exports.parse = {
      'application/x-www-form-urlencoded': parseString
    , 'application/json': JSON.parse
  };

  /**
   * Parse the given header `str` into
   * an object containing the mapped fields.
   *
   * @param {String} str
   * @return {Object}
   * @api private
   */

  function parseHeader(str) {
    var lines = str.split(/\r?\n/)
      , fields = {}
      , index
      , line
      , field
      , val
      , i;

    lines.pop(); // trailing CRLF

    for (i = 0, len = lines.length; i < len; ++i) {
      line = lines[i];
      index = line.indexOf(':');
      field = line.slice(0, index).toLowerCase();
      val = trim(line.slice(index + 1));
      fields[field] = val;
    }

    return fields;
  }

  /**
   * Initialize a new `Response` with the given `xhr`.
   *
   *  - set flags (.ok, .error, etc)
   *  - parse header
   *
   * Examples:
   *
   *  Aliasing `superagent` as `request` is nice:
   *
   *      request = superagent;
   *
   *  We can use the promise-like API, or pass callbacks:
   *
   *      request.get('/').end(function(res){});
   *      request.get('/', function(res){});
   *
   *  Sending data can be chained:
   *
   *      request
   *        .post('/user')
   *        .data({ name: 'tj' })
   *        .end(function(res){});
   *
   *  Or passed to `.send()`:
   *
   *      request
   *        .post('/user')
   *        .send({ name: 'tj' }, function(res){});
   *
   *  Or passed to `.post()`:
   *
   *      request
   *        .post('/user', { name: 'tj' })
   *        .end(function(res){});
   *
   * Or further reduced to a single call for simple cases:
   *
   *      request
   *        .post('/user', { name: 'tj' }, function(res){});
   *
   * @param {XMLHTTPRequest} xhr
   * @param {Object} options
   * @api private
   */

  function Response(xhr, options) {
    options = options || {};
    this.xhr = xhr;
    this.text = xhr.responseText;
    this.setStatusProperties(xhr.status);
    this.header = parseHeader(xhr.getAllResponseHeaders());
    this.setHeaderProperties(this.header);
    this.body = this.parseBody(this.text);
  }

  /**
   * Set header related properties:
   *
   *   - `.contentType` the content type without params
   *
   * A response of "Content-Type: text/plain; charset=utf-8"
   * will provide you with a `.contentType` of "text/plain".
   *
   * @param {Object} header
   * @api private
   */

  Response.prototype.setHeaderProperties = function(header){
    // TODO: moar!
    var params = (this.header['content-type'] || '').split(/ *; */);
    this.contentType = params.shift();
    this.setParams(params);
  };

  /**
   * Create properties from `params`.
   *
   * For example "Content-Type: text/plain; charset=utf-8"
   * would provide `.charset` "utf-8".
   *
   * @param {Array} params
   * @api private
   */

  Response.prototype.setParams = function(params){
    var param
      , i;
    for (i = 0, len = params.length; i < len; ++i) {
      param = params[i].split(/ *= */);
      this[param[0]] = param[1];
    }
  };

  /**
   * Parse the given body `str`.
   *
   * Used for auto-parsing of bodies. Parsers
   * are defined on the `superagent.parse` object.
   *
   * @param {String} str
   * @return {Mixed}
   * @api private
   */

  Response.prototype.parseBody = function(str){
    var parse = exports.parse[this.contentType];
    return parse
      ? parse(str)
      : null;
  };

  /**
   * Set flags such as `.ok` based on `status`.
   *
   * For example a 2xx response will give you a `.ok` of __true__
   * whereas 5xx will be __false__ and `.error` will be __true__. The
   * `.clientError` and `.serverError` are also available to be more
   * specific, and `.statusType` is the class of error ranging from 1..5
   * sometimes useful for mapping respond colors etc.
   *
   * "sugar" properties are also defined for common cases. Currently providing:
   *
   *   - .noContent
   *   - .badRequest
   *   - .unauthorized
   *   - .notAcceptable
   *   - .notFound
   *
   * @param {Number} status
   * @api private
   */

  Response.prototype.setStatusProperties = function(status){
    var type = status / 100 | 0;

    // status / class
    this.status = status;
    this.statusType = type;

    // basics
    this.info = 1 === type;
    this.ok = 2 === type;
    this.clientError = 4 === type;
    this.serverError = 5 === type;
    this.error = 4 === type || 5 === type;

    // sugar
    this.accepted = 202 === status;
    this.noContent = 204 === status || 1223 === status;
    this.badRequest = 400 === status;
    this.unauthorized = 401 === status;
    this.notAcceptable = 406 === status;
    this.notFound = 404 === status;
  };

  /**
   * Expose `Response`.
   */

  exports.Response = Response;

  /**
   * Initialize a new `Request` with the given `method` and `url`.
   *
   * @param {String} method
   * @param {String} url
   * @api public
   */
  
  function Request(method, url) {
    var self = this;
    EventEmitter.call(this);
    this.method = method;
    this.url = url;
    this.header = {};
    this.set('X-Requested-With', 'XMLHttpRequest');
    this.on('end', function(){
      self.callback(new Response(self.xhr));
    });
  }

  /**
   * Inherit from `EventEmitter.prototype`.
   */

  Request.prototype = new EventEmitter();
  Request.prototype.constructor = Request;

  /**
   * Set header `field` to `val`, or multiple fields with one object.
   *
   * Examples:
   *
   *      req.get('/')
   *        .set('Accept', 'application/json')
   *        .set('X-API-Key', 'foobar')
   *        .end(callback);
   *
   *      req.get('/')
   *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
   *        .end(callback);
   *
   * @param {String|Object} field
   * @param {String} val
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.set = function(field, val){
    var key;
    
    if (isObject(field)) {
      for (key in field) {
        if (field.hasOwnProperty(key)) {
          this.set(key, field[key]);
        }
      }
      return this;
    }
    this.header[field.toLowerCase()] = val;
    return this;
  };

  /**
   * Set Content-Type to `type`, mapping values from `exports.types`.
   *
   * Examples:
   *
   *      superagent.types.xml = 'application/xml';
   *
   *      request.post('/')
   *        .type('xml')
   *        .data(xmlstring)
   *        .end(callback);
   *      
   *      request.post('/')
   *        .type('application/xml')
   *        .data(xmlstring)
   *        .end(callback);
   *
   * @param {String} type
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.type = function(type){
    this.set('Content-Type', exports.types[type] || type);
    return this;
  };

  /**
   * Send `data`, defaulting the `.type()` to "json" when
   * an object is given.
   *
   * Examples:
   *
   *       // querystring
   *       request.get('/search')
   *         .data({ search: 'query' })
   *         .end(callback)
   *
   *       // multiple data "writes"
   *       request.get('/search')
   *         .data({ search: 'query' })
   *         .data({ range: '1..5' })
   *         .data({ order: 'desc' })
   *         .end(callback)
   *
   *       // manual json
   *       request.post('/user')
   *         .type('json')
   *         .data('{"name":"tj"})
   *         .end(callback)
   *       
   *       // auto json
   *       request.post('/user')
   *         .data({ name: 'tj' })
   *         .end(callback)
   *       
   *       // manual x-www-form-urlencoded
   *       request.post('/user')
   *         .type('form-data')
   *         .data('name=tj')
   *         .end(callback)
   *       
   *       // auto x-www-form-urlencoded
   *       request.post('/user')
   *         .type('form-data')
   *         .data({ name: 'tj' })
   *         .end(callback)
   *
   * @param {String|Object} data
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.data = function(data){
    var obj = isObject(data)
      , key;

    // merge
    if (obj && isObject(this._data)) {
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          this._data[key] = data[key];
        }
      }
    } else {
      this._data = data;
    }

    if ('GET' === this.method) { return this; }
    if (!obj) { return this; }
    if (this.header['content-type']) { return this; }
    this.type('json');
    return this;
  };

  /**
   * Send `.data()` and `.end()` with optional callback `fn`.
   *
   * Examples:
   *
   *       // equivalent to .end()
   *       request.post('/user').send();
   *       
   *       // equivalent to .data(user).end()
   *       request.post('/user').send(user);
   *       
   *       // equivalent to .data(user).end(callback)
   *       request.post('/user').send(user, callback);
   *       
   *       // equivalent to ..end(callback)
   *       request.post('/user').send(callback);
   *
   * @param {Object|String} data
   * @param {Function} fn
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.send = function(data, fn){
    if (isFunction(data)) {
      this.end(data);
    } else if (data) {
      this.data(data).end(fn);
    } else {
      this.end();
    }
    return this;
  };

  /**
   * Initiate request, invoking callback `fn(res)`
   * with an instanceof `Response`.
   *
   * @param {Function} fn
   * @return {Request} for chaining
   * @api public
   */

  Request.prototype.end = function(fn){
    var self = this
      , xhr = this.xhr = getXHR()
      , data = this._data || null
      , field;

    // store callback
    this.callback = fn || noop;

    // state change
    xhr.onreadystatechange = function(){
      if (4 === xhr.readyState) { self.emit('end'); }
    };

    // querystring
    if ('GET' === this.method && null !== data) {
      this.url += '?' + exports.serializeObject(data);
      data = null;
    }

    // initiate request
    xhr.open(this.method, this.url, true);

    // body
    if ('GET' !== this.method && 'HEAD' !== this.method) {
      // serialize stuff
      var serialize = exports.serialize[this.header['content-type']];
      if (serialize) { data = serialize(data); }
    }

    // set header fields
    for (field in this.header) {
      if (this.header.hasOwnProperty(field)) {
        xhr.setRequestHeader(field, this.header[field]);
      }
    }

    // send stuff
    xhr.send(data);
    return this;
  };
  
  /**
   * Expose `Request`.
   */
  
  exports.Request = Request;

  /**
   * Issue a request:
   *
   * Examples:
   *
   *    request('GET', '/users').end(callback)
   *    request('/users').end(callback)
   *    request('/users', callback)
   *
   * @param {String} method
   * @param {String|Function} url or callback
   * @return {Request}
   * @api public
   */

  function request(method, url) {
    // callback
    if ('function' === typeof url) {
      return new Request('GET', method).end(url);
    }

    // url first
    if (1 === arguments.length) {
      return new Request('GET', method);
    }

    return new Request(method, url);
  }

  /**
   * GET `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} data
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.get = function(url, data, fn){
    var req = request('GET', url);
    if (isFunction(data)) { fn = data; data = null; }
    if (data) { req.data(data); }
    if (fn) { req.end(fn); }
    return req;
  };

  /**
   * DELETE `url` with optional callback `fn(res)`.
   *
   * @param {String} url
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.del = function(url, fn){
    var req = request('DELETE', url);
    if (fn) { req.end(fn); }
    return req;
  };

  /**
   * POST `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} data
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.post = function(url, data, fn){
    var req = request('POST', url);
    if (data) { req.data(data); }
    if (fn) { req.end(fn); }
    return req;
  };

  /**
   * PUT `url` with optional `data` and callback `fn(res)`.
   *
   * @param {String} url
   * @param {Mixed} data
   * @param {Function} fn
   * @return {Request}
   * @api public
   */

  request.put = function(url, data, fn){
    var req = request('PUT', url);
    if (data) { req.data(data); }
    if (fn) { req.end(fn); }
    return req;
  };

  return exports;
  
}({}));(function() {
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
