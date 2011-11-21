/* dribbledb: simple syncing in javascript
 *
 * copyright 2011 pedro teixeira <metaduck.com> & nuno job <nunojob.com> (oO)--',--
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
 * BUILD DATE: Mon Nov 21 11:50:06 2011 +0000
 */

 (function() {
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

  if (callbacks && callbacks.length > 0) {
    for (i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i](args);
    }
  } else {
    if ('error' === event) {
      throw args[0] || new Error('Unspecified error');
    }
  }

  return this;
};

var request = (function(exports){
  
  exports = request;
  exports.version = '0.1.1';
  var noop = function(){};

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
    if (null === obj || undefined == obj) { return false; }
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
    this.options = options;
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
    var parse = exports.parse[this.options.expectResponseType || this.contentType];
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
    this.notFound = 404 === status;
    this.notAcceptable = 406 === status;
    this.conflict = 409 === status;
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
      var resp = new Response(self.xhr, {expectResponseType:self._expectResponseType})
        , err;

      if (resp.status === 0) { err = new Error('Unknown XHR Error'); }
      self.callback(err, resp);
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
  
  Request.prototype.expectResponseType = function(type) {
    this._expectResponseType = exports.types[type] || type;
    return this;
  }

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
  
}({}));function remote(method, uri, body, cb) {
  if ('function' === typeof(arguments[2])) { cb = body; body = undefined; }
  request[method](uri, body)
    .expectResponseType('json')
    .end(cb);
}
function remote_get(uri, cb) {
  remote('get', uri, undefined, cb);
}

// =============================================================== storage ~==
function store() {
  function browser_get(path) {
    var document = root.localStorage.getItem(path);
    return JSON.parse(document);
  }

  function browser_put(path, document) {
    document = JSON.stringify(document);
    root.localStorage.setItem(path, document);
  }

  function browser_destroy(path) {
    if (null !== root.localStorage.getItem(path)) {
      root.localStorage.removeItem(path);
      return true;
    }
    return false;
  }

  function browser_all_keys_iterator(path, cb, done) {
    var storage = root.localStorage;
    var i = 0, key;
    (function iterate() {

      function next() {
        i ++;
        if (i < storage.length) { iterate(); }
        else { if (done) { done(); } }
      }
      key = storage.key(i);
      if (key) {
        if (0 === key.indexOf(path)) {
          cb(key.slice(path.length + 1), browser_get(key), next);
        } else {
          next();
        }
      } else {
        next();
      }
    }());
  }

  function browser_all_keys(path) {
    var keys = [];
    browser_all_keys_iterator(path, function(key, value, done) {
      keys.push(key);
      done();
    });
    return keys;
  }

  if(! root.localStorage) {
    throw new Error('At the moment this only works in modern browsers');
  }
  return { get     : browser_get
         , put     : browser_put
         , destroy : browser_destroy
         , all_keys_iterator: browser_all_keys_iterator
         , all_keys: browser_all_keys
         };
}
function key(type, base_url) { return STORAGE_NS + ':' + type + ':' + base_url; }
function global_item_key(type, base_url, id)   {
  if (id !== undefined) {
    base_url += ('/' + id);
  }
  return key(type,  base_url);
}
function global_doc_key(base_url, id)   { return global_item_key('d', base_url,  id);  }
function global_meta_key(base_url, id)   { return global_item_key('m', base_url, id);  }
function global_since_key(base_url)   { return global_item_key('s', base_url);  }var uuid = (function() {
  /*
  * Generate RFC4122 (v1 and v4) UUIDs
  *
  * Documentation at https://github.com/broofa/node-uuid
  */

  // 12219292800000 is the number of milliseconds between UUID epoch
  // 1582-10-15 00:00:00 and UNIX epoch 1970-01-01 00:00:00.
  var EPOCH_OFFSET = 12219292800000;

  // Number of 100ns ticks of the actual resolution of the system's clock
  var UUIDS_PER_TICK = 10000;

  // Use node.js Buffer class if available, otherwise use the Array class
  var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;

  // Buffer used for generating string uuids
  var _buf = new BufferClass(16);

  // Cache number <-> hex string for octet values
  var toString = [];
  var toNumber = {};
  for (var i = 0; i < 256; i++) {
    toString[i] = (i + 0x100).toString(16).substr(1);
    toNumber[toString[i]] = i;
  }

  function parse(s) {
    var buf = new BufferClass(16);
    var i = 0;
    s.toLowerCase().replace(/[0-9a-f][0-9a-f]/g, function(octet) {
      buf[i++] = toNumber[octet];
    });
    return buf;
  }

  function unparse(buf) {
    var tos = toString, b = buf;
    return tos[b[0]] + tos[b[1]] + tos[b[2]] + tos[b[3]] + '-' +
           tos[b[4]] + tos[b[5]] + '-' +
           tos[b[6]] + tos[b[7]] + '-' +
           tos[b[8]] + tos[b[9]] + '-' +
           tos[b[10]] + tos[b[11]] + tos[b[12]] +
           tos[b[13]] + tos[b[14]] + tos[b[15]];
  }

  var ff = 0xff;

  // Feature detect for the WHATWG crypto API. See
  // http://wiki.whatwg.org/wiki/Crypto
  var useCrypto = this.crypto && crypto.getRandomValues;
  var rnds = useCrypto ? new Uint32Array(4) : new Array(4);

  if (useCrypto) {
    crypto.getRandomValues(rnds);
  } else {
    rnds[0] = Math.random() * 0x100000000;
    rnds[1] = Math.random() * 0x100000000;
    rnds[2] = Math.random() * 0x100000000;
  }

  // Generate a node value for this instance. Use a randomly generated node
  // instead of a mac address. RFC suggests generating a 47 bit random integer,
  // but we're limited to 32 bit in js, so we just use two 32 bit.
  var node = [
    rnds[0] & ff | 0x01, // Set multicast bit, see 4.1.6 and 4.5
    rnds[0] >>> 8 & ff,
    rnds[0] >>> 16 & ff,
    rnds[0] >>> 24 & ff,
    rnds[1] & ff,
    rnds[1] >>> 8 & ff
  ];

  // Use 14 bit random unsigned integer to initialize clock_seq, see 4.2.2.
  var cs = rnds[2] & 0x3fff; // Cut down 32 bit random integer to 14 bit

  // Used to track time-regressions for updating the clock_seq
  var last = 0;

  // Number of UUIDs that have been created during the current millisecond-
  // interval. Used to simulate higher clock resolution as suggested in 4.2.1.2.
  var count = 0;

  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html
  function v1(options, buf, offset) {
    if (typeof options === 'string') { // backwards compatibility
      options = {format: options};
    }
    options = options || {};

    var b = options.format != 'binary' ? _buf : (buf ? buf : new BufferClass(16));
    var i = buf && offset || 0;

    // Get current time and simulate higher clock resolution
    var now = (options.timestamp !== undefined ?
               options.timestamp :
               new Date().getTime()) + EPOCH_OFFSET;
    count = (now === last) ? count + 1 : 0;
    count = options.count || count;

    // Per 4.2.1.2, if time regresses we bump the clock sequence.
    // (Or if we're generating more than 10k uuids/sec - an extremely unlikely
    // case the RFC doesn't address)
    if (now < last || count > UUIDS_PER_TICK) {
      cs++;
      count = 0;
    }
    last = now;

    // Timestamp, see 4.1.4
    var timestamp = now;
    var tl = ((timestamp & 0xfffffff) * 10000 + count) % 0x100000000;
    var tmh = ((timestamp / 0x100000000) * 10000) & 0xfffffff;
    var tm = tmh & 0xffff;
    var th = tmh >> 16;
    var thav = (th & 0xfff) | 0x1000; // Set version, see 4.1.3

    // Clock sequence
    cs = (options.clockseq !== undefined) ? options.clockseq : cs;
    var csl = cs & 0xff;
    var cshar = (cs >>> 8) | 0x80; // Set the variant, see 4.2.2

    // time_low
    b[i++] = tl >>> 24 & ff;
    b[i++] = tl >>> 16 & ff;
    b[i++] = tl >>> 8 & ff;
    b[i++] = tl & ff;

    // time_mid
    b[i++] = tm >>> 8 & ff;
    b[i++] = tm & ff;

    // time_high_and_version
    b[i++] = thav >>> 8 & ff;
    b[i++] = thav & ff;

    // clock_seq_hi_and_reserved
    b[i++] = cshar;

    // clock_seq_low
    b[i++] = csl;

    // node
    node = options.node || node;
    var n = 0;
    b[i++] = node[n++];
    b[i++] = node[n++];
    b[i++] = node[n++];
    b[i++] = node[n++];
    b[i++] = node[n++];
    b[i++] = node[n++];

    return options.format === undefined ? unparse(b) : b;
  }

  function v4(options, buf, offset) {
    if (typeof options === 'string') { // backwards compatibility
      options = {format: options};
    }
    options = options || {};

    var b = options.format != 'binary' ? _buf : (buf ? buf : new BufferClass(16));
    var i = buf && offset || 0;

    if (options.random) {
      rnds = options.random;
    } else {
      if (useCrypto) {
        crypto.getRandomValues(rnds);
      } else {
        rnds[0] = Math.random() * 0x100000000;
        rnds[1] = Math.random() * 0x100000000;
        rnds[2] = Math.random() * 0x100000000;
        rnds[3] = Math.random() * 0x100000000;
      }
    }

    var r = rnds[0];
    b[i++] = r & ff;
    b[i++] = r >>> 8 & ff;
    b[i++] = r >>> 16 & ff;
    b[i++] = r >>> 24 & ff;
    r = rnds[1];
    b[i++] = r & ff;
    b[i++] = r >>> 8 & ff;
    b[i++] = r >>> 16 & 0x0f | 0x40; // See RFC4122 sect. 4.1.3
    b[i++] = r >>> 24 & ff;
    r = rnds[2];
    b[i++] = r & 0x3f | 0x80; // See RFC4122 sect. 4.4
    b[i++] = r >>> 8 & ff;
    b[i++] = r >>> 16 & ff;
    b[i++] = r >>> 24 & ff;
    r = rnds[3];
    b[i++] = r & ff;
    b[i++] = r >>> 8 & ff;
    b[i++] = r >>> 16 & ff;
    b[i++] = r >>> 24 & ff;

    return options.format === undefined ? unparse(b) : b;
  }

  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined') {
    module.exports = uuid;
  } else {
    return uuid;
  }
}()).v4;var root             = this
  , previous_dribble = root.dribbledb
  , STORAGE_NS       = 'dbd'
  , local_store      = store()
  ;

function dribbledb(base_url) {
  var that = {}
    , sync;
  
  function doc_key(id) {
    return global_doc_key(base_url, id);
  }

  function meta_key(id) {
    return global_meta_key(base_url, id);
  }
  
  function since_key() {
    return global_since_key(base_url);
  }
  
  function unsynced_keys() {
    return local_store.all_keys(meta_key());
  }
  
  function unsynced_keys_iterator(cb, done) {
    local_store.all_keys_iterator(meta_key(), cb, done);
  }
  
  function pulled_since(val) {
    var key = since_key();
    if (! val) {
      return local_store.get(key) || 0;
    } else {
      local_store.put(key, val);
    }
  }


  // ============================= DB manipulation  ~===

  function put(key, value) {
    if (arguments.length < 2) {
      value = key;
      key = value.id || value._id || uuid();
    }
    var uri = doc_key(key);
    local_store.put(uri, value);
    local_store.put(meta_key(key), 'p');
    return key;
  }
  
  function remote_put(key, value) {
    var uri = doc_key(key);
    local_store.put(uri, value);
  }
  
  function get(key) {
    return local_store.get(doc_key(key));
  }

  function destroy(key) {
    var meta_value = 'd';
    var old = get(key);
    if (old && old._rev) { meta_value += old._rev; }
    if (local_store.destroy(doc_key(key))) {
      local_store.put(meta_key(key), meta_value);
    }
  }

  function remote_destroy(key) {
    local_store.destroy(doc_key(key));
  }
  
  function all(cb, done) {
    var ret;

    if ('function' !== typeof(cb)) {
      ret = [];
      cb = function(key, value, done) {
        ret.push(value);
        done();
      }
    }
    
    local_store.all_keys_iterator(doc_key(), cb, done);
    return ret;
  }
  

  // ========================================= sync   ~==

  sync = (function() {
    var syncEmitter = new EventEmitter();

    function sync(resolveConflicts, cb) {
      var calledback = false;
      
      if (arguments.length < 2) { cb = resolveConflicts; resolveConflicts = undefined;}
      
      function callback() {
        if (! calledback && typeof(cb) === 'function') {
          calledback = true;
          cb.apply(that, arguments);
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
      

      // === push to remote ~=============

      function push_one(key, value, done) {
        var method
          , op = value.charAt(0)
          , rev = value.substr(1)
          , mine = get(key)
          , uri = base_url + '/' + key;
        
        method = op === 'p' ? 'put' : (op === 'd' ? 'del' : undefined);
        if (! method) { throw new Error('Invalid meta action: ' + value); }

        if (rev) { uri += '?rev=' + rev; }
        
        function handleResponse(err, res) {
          if (err) { return error(err); }

          // ======= conflict! ~==

          if (res.conflict) {
            remote_get(uri, function(err, resp) {
              if (err) { return error(err); }
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
                error(err);
              }
            });
          } else {
            if (('del' !== method || ! res.notFound) && ! res.ok) { return error(new Error(method + ' ' + uri + ' failed with response status ' + res.status + ': ' + res.text)); }
            local_store.destroy(meta_key(key));
            done();
          }
        }
        
        remote(method, uri, mine, handleResponse)
      }
      

      // === pull from remote ~=============

      function pull(cb) {
        var uri = base_url + '/_changes?since=' + pulled_since() + '&include_docs=true&force_json=true';
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
      
      unsynced_keys_iterator(push_one, function(err) {
        if (err) { return error(err); }
        pull(function(err) {
          if (err) { return error(err); }
          callback();
        });
      });
    }

    sync.on = function() {
      syncEmitter.on.apply(syncEmitter, arguments);
    };

    return sync;
    
  }());
  
  that.sync = sync;
  that.put = put;
  that.get = get;
  that.destroy = destroy;
  that.unsynced_keys = unsynced_keys;
  that.all = all;
  
  return that;
}


// =============================================================== exports ~==

dribbledb.version = '0.1.0';
if ('function' === typeof(define) && define.amd) {
  define('dribbledb', function() {
    return dribbledb;
  });
} 
else {
  root.dribbledb = dribbledb;
}}());
