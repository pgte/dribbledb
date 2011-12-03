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
 * BUILD DATE: Mon Nov 28 12:14:58 2011 +0000
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
    , i, len;

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
      , i, len;

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
      , i, len;

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
      , i, len;
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
    var parse = exports.parse[this.ok && this.options.expectResponseType || this.contentType];
    return parse ? parse(str) : null;
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
  
}({}));function noop() {};function remote(method, uri, body, cb) {
  if ('function' === typeof(arguments[2])) { cb = body; body = undefined; }
  request[method](uri, body)
    .type('application/javascript')
    .expectResponseType('json')
    .end(cb);
}
function remote_get(uri, cb) {
  remote('get', uri, undefined, cb);
}

var uuid = (function() {
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
  ;

function dribbledb(base_url, options) {// === keys ~========

function item_key(type, id)   {
  var str = type;
  if (id !== undefined) {
    str += ('/' + id);
  }
  return str;
}
var DOC_PREFIX = 'd';
var META_PREFIX = 'm';
var SINCE_PREFIX = 's';

function create_storage(engineConstructor) {
  return function(base_url) {
    var engine = engineConstructor(base_url);


    // === data manipulation ~========

    function doc_get(key, cb) { return engine.get(DOC_PREFIX, key, cb); }
    function doc_put(key, value, cb) { return engine.put(DOC_PREFIX, key, value, cb); }
    function doc_destroy(key, cb) { return engine.destroy(DOC_PREFIX, key, cb); }
    function meta_get(key, cb) { return engine.get(META_PREFIX, key, cb); }
    function meta_put(key, value, cb) { return engine.put(META_PREFIX, key, value, cb); }
    function meta_destroy(key, cb) { return engine.destroy(META_PREFIX, key, cb); }
    function all_doc_keys_iterator(cb, done) { return engine.all_keys_iterator(DOC_PREFIX, cb, done); }
    function all_doc_keys(cb) { return engine.all_keys(DOC_PREFIX, cb); }
    function all_meta_keys_iterator(cb, done) { return engine.all_keys_iterator(META_PREFIX, cb, done); }
    function all_meta_keys(cb) { return engine.all_keys(META_PREFIX, cb); }

    function pulled_since(val, cb) {
      if ('function' !== typeof(cb)) { throw new Error('2nd argument must be a function'); }
      if (! val) {
        engine.get(SINCE_PREFIX, undefined, function(err, val) {
          if (err) { return cb(err); }
          cb(null, val || 0);
        });
      } else {
        return engine.put(SINCE_PREFIX, undefined, val, cb);
      }
    }

    return {
        stratName      : engine.stratName
      , internalName   : engine.internalName
      , doc : {
            get        : doc_get
          , put        : doc_put
          , destroy    : doc_destroy
          , all_keys_iterator : all_doc_keys_iterator
          , all_keys   : all_doc_keys
        }
      , meta : {
          get       : meta_get
        , put       : meta_put
        , destroy   : meta_destroy
        , all_keys_iterator : all_meta_keys_iterator
        , all_keys  : all_meta_keys
      }
      , pulled_since   : pulled_since
      , ready: engine.ready
    }
  }
}var stores = {};
function store_strategy_idbstore(base_url) {

  // Singleton for each DB (url)
  if (stores[base_url]) { return stores[base_url]; }

  var store = (function() {
    var DB_VERSION = '1.2';
    var idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var consts = window.IDBTransaction || window.webkitIDBTransaction || window.msIndexedDB;
    var IDBDatabaseException = window.IDBDatabaseException || window.webkitIDBDatabaseException;
    var errorCodes = Object.keys(IDBDatabaseException);
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

    var dbName;
    var db;
    var dbs_enum = ['d', 'm', 's'];

    var stores = {};
    var ready = false;
    var initializing = false;
    var initializationError;

    var readyQueue = [];
    
    function decodeErrorEvent(evt) {
      var code = evt.target.errorCode;
      var message = errorCodes[code].toLowerCase();
      var err = new Error(message);
      err.code = code;
      err.event = evt;
      return err;
    }
    
    function proxyErrorEvent(cb) {
      return function(evt) {
        cb(decodeErrorEvent(evt));
      }
    } 

    function setDBVersion(cb) {
      if (db.version !== DB_VERSION) {
        var versionReq = db.setVersion(DB_VERSION);
        
        versionReq.onerror = versionReq.onblocked = proxyErrorEvent(cb);
        versionReq.onsuccess = function(event) {
          console.log('222');
          cb();
        }
      } else {
        cb();
      }
    }

    function initializeDB(cb) {
      dbName = STORAGE_NS + '::' + base_url;
      var openRequest = idb.open(dbName, 'DribbleDB', {keyPath: '_id'});
      openRequest.onerror = proxyErrorEvent(cb);
      openRequest.onsuccess = function(event) {
        db = event.target.result;
        setDBVersion(function(err, init) {
          if (err) { return cb(err); }
          var i = -1;
          (function next() {
            var db_name;
            i += 1;
            if (i >= dbs_enum.length) { return cb(); }
            db_name = dbs_enum[i];
            if (db.objectStoreNames.contains(db_name)) {
              var emptyTransaction = db.transaction([], consts.READ_ONLY);
              stores[db_name] = emptyTransaction.objectStore(db_name);
              next();
            } else {
              stores[db_name] = db.createObjectStore(db_name, { keyPath: '_id'});
              next();
            }
          }());
        });
      };
    }

    function onStoreReady(cb) {
      if ('function' !== typeof(cb)) { throw new Error('onStoreReady needs callabck function'); }
      if (ready) {
        cb();
      } else {
        if (! initializing) {
          initializing = true;
          initializeDB(function(err) {
            initializing = false;
            if (err) { initializationError = err; }
            setTimeout(function() {
              ready = true;
              for(var i in readyQueue) {
                readyQueue[i](initializationError);
              }
              cb();
            }, 0);
          });
        } else {
          if (initializationError) { return cb(initializationError); }
          readyQueue.push(cb)
        }
      }
    }

    function idb_get(prefix, id, cb) {
      onStoreReady(function(err) {
        if (err) { return cb(err); }
        var getRequest = db.transaction([prefix], consts.READ_ONLY).objectStore(prefix).get(id);
        getRequest.onsuccess = function(event) {
          setTimeout(function() {
            cb(null, event.target.result);
          }, 0);
        };
        getRequest.onerror = proxyErrorEvent(cb);
      });
    }

    function idb_put(prefix, id, value, cb) {
      onStoreReady(function(err) {
        if (err) { return cb(err); }
        value._id || (value._id = id);
        console.log('putting', value, typeof(value));
        var putRequest = db.transaction([prefix], consts.READ_WRITE).objectStore(prefix).put(value);
        putRequest.onsuccess = function(event){
          console.log('success');
          setTimeout(function() {
            cb(null, event.target.result);
          }, 0)
        };
        putRequest.onerror = proxyErrorEvent(cb);
      });
    }

    function idb_destroy(prefix, id, cb) {
      onStoreReady(function(err) {
        if (err) { return cb(err); }
        var putRequest = db.transaction([prefix], consts.READ_WRITE).objectStore(prefix).delete(id);
        putRequest.onsuccess = function(event){
          setTimeout(function() {
            cb(null, event.target.result);
          }, 0);
        };
        putRequest.onerror = proxyErrorEvent(cb);
      });
    }

    function idb_all_keys_iterator(prefix, cb, done) {
      console.log('idb_all_keys_iterator:', prefix);
      onStoreReady(function(err) {
        var range;
        if (err) { return done(err); }
        console.log('idb_all_keys_iteratorprefix:', prefix);
        // var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = db.transaction([prefix], consts.READ).objectStore(prefix).openCursor();
        cursorRequest.onsuccess = function(event) {
          var result = event.target.result
            , val;
          if (!! result === false) {
            return done();
          }
          
          val = result.value;
          cb(val._id || val.id, val, function() {
            result.continue();
          });
        }
        cursorRequest.onerror = done;
      });
    }


    function idb_all_keys(prefix, cb) {
      var keys = [];
      idb_all_keys_iterator(prefix, function(key, value, done) {
        keys.push(key);
        done();
      }, function(err) {
        if (err) { return cb(err); }
        cb(null, keys);
      });
    }

    return { get     : idb_get
           , put     : idb_put
           , destroy : idb_destroy
           , all_keys_iterator: idb_all_keys_iterator
           , all_keys: idb_all_keys
           , stratName: 'idbstore'
           , ready: onStoreReady
           , internalName: dbName
           };
  }());
  
  stores[base_url] = store;
  return store;
}function store_strategy_webstore(base_url, store, strat_name) {

  function full_path(prefix, id) {
    if (prefix.length != 1) { throw new Error('Invalid prefix: ' + prefix); }
    var path = STORAGE_NS + ':' + prefix + ':' + base_url;
    if ('undefined' !== typeof(id)) {
      path += '/' + id;
    }
    return path;
  }

  function browser_get(prefix, id, cb) {
    if ('function' !== typeof(cb)) { throw new Error('3rd argument must be a function'); }
    var doc = store.getItem(full_path(prefix, id));
    cb(null, JSON.parse(doc));
  }

  function browser_put(prefix, id, document, cb) {
    if ('function' !== typeof(cb)) { throw new Error('3rd argument must be a function'); }
    var key = full_path(prefix, id)
      , doc = JSON.stringify(document);
    store.setItem(key, doc);
    cb();
  }

  function browser_destroy(prefix, id, cb) {
    if ('function' !== typeof(cb)) { throw new Error('3rd argument must be a function'); }
    var path = full_path(prefix, id);
    if (null !== store.getItem(path)) {
      store.removeItem(path);
      return cb(null, true);
    }
    return cb(null, false);
  }

  function browser_all_keys_iterator(prefix, cb, done) {
    var storage = store
      , keys, i = 0
      , path = full_path(prefix);

    done = done || noop;
    
    keys = (function() {
      var key
        , i
        , keys = [];

      for(i = 0; i < storage.length; i ++) {
        key = storage.key(i);
        if (key && 0 === key.indexOf(path)) {
          keys.push(key);
        }
      }
      return keys;
    }());
    
    (function iterate() {
      var key, retKey;

      if (i >= keys.length) { return done(); }

      function next() {
        i ++;
        iterate();
      }

      key = keys[i];
      retKey = key.slice(path.length + 1);
      browser_get(prefix, retKey, function(err, val) {
        if (err) { return done(err); }
        cb(retKey, val, next);
      });
    }());
  }

  function browser_all_keys(prefix, done) {
    var keys = [];
    browser_all_keys_iterator(prefix, function(key, value, next) {
      keys.push(key);
      next();
    }, function(err) {
      if (err) { return done(err); };
      done(null, keys);
    });
  }
  
  function ready(cb) {
    cb();
  }

  if(! store) { throw new Error('At the moment this only works in modern browsers'); }

  return { get     : browser_get
         , put     : browser_put
         , destroy : browser_destroy
         , all_keys_iterator: browser_all_keys_iterator
         , all_keys: browser_all_keys
         , stratName: strat_name
         , ready: ready
         };
}function store_strategy_localstore(base_url) {
  return store_strategy_webstore(base_url, root.localStorage, 'localstore');
}
function store_strategy_sessionstore(base_url) {
  return store_strategy_webstore(base_url, root.sessionStorage, 'sessionstore');
}
function store_strategy_memstore(base_url) {
  var store = {};

  function full_path(prefix, id) {
    if (prefix.length > 1) { throw new Error('Invalid prefix: ' + prefix); }
    var path = STORAGE_NS + ':' + prefix + ':' + base_url;
    if ('undefined' !== typeof(id)) {
      path += '/' + id;
    }
    return path;
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function mem_get(prefix, id, cb) {
    var o = store[full_path(prefix, id)]
      , val = null;
    if ('undefined' !== typeof(o)) { val = clone(o); }
    cb(null, val);
  }

  function mem_put(prefix, id, document, cb) {
    store[full_path(prefix, id)] = clone(document);
    cb(null, id);
  }

  function mem_destroy(prefix, id, cb) {
    delete store[full_path(prefix, id)];
    cb(null);
  }

  function mem_all_keys_iterator(prefix, cb, done) {
    var storage = store
      , keys, i = 0
      , path = full_path(prefix);

    done = done || noop;

    keys = (function() {
      var key
        , keys = [];

      for(key in store) {
        if (key && 0 === key.indexOf(path)) {
          keys.push(key);
        }
      }
      return keys;
    }());

    (function iterate() {
      var key;

      if (i >= keys.length) { return done(); }

      function next() {
        i ++;
        iterate();
      }

      key = keys[i];
      cb(key.slice(path.length + 1), mem_get(key), next);
    }());
  }

  function mem_all_keys(prefix, cb) {
    var keys = [];
    mem_all_keys_iterator(prefix, function(key, value, done) {
      keys.push(key);
      done();
    });
    cb(null, keys);
  }
  
  function ready(cb) {
    cb();
  }

  return { get     : mem_get
         , put     : mem_put
         , destroy : mem_destroy
         , all_keys_iterator: mem_all_keys_iterator
         , all_keys: mem_all_keys
         , ready: ready
         , stratName: 'memstore'
         };
}function resolve_storage_strategy(strat_name) {
  var strats = {
      'idbstore'     : store_strategy_idbstore
    , 'localstore'   : store_strategy_localstore
    , 'sessionstore' : store_strategy_sessionstore
    , 'memstore'     : store_strategy_memstore
  };
  return create_storage(strats[strat_name]);
}function resolve_pull_strategy(strat_name) {
  var strat;
  if ('function' === typeof(strat_name)) { strat = strat_name; }
  else {
    switch(strat_name) {
      case 'couchdb_bulk':
        strat = pull_strategy_couchdb_bulk;
      break;
      default:
        throw new Error('Unknown pull strategy: ' + strat_name);
    }
  }
  return strat;
}function pull_strategy_couchdb_bulk() {

  return function(resolveConflicts, cb) {

    var calledback = false;

    pulled_since(function(err, since) {
      if (err) { return cb(err); }

      var uri = base_url + '/_changes?since=' + since + '&include_docs=true';


      remote_get(uri, function(err, resp) {
        var i, body, results, change, key, theirs, err2, mine;

        if (err) { return cb(err); }
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
            store.meta.get(key, function(err, metaVal) {
              if (err) { return cb(err); }
              if (metaVal) {
                if (resolveConflicts) {
                  store.doc_get(key, function(err, mine) {
                    if (err) { return cb(err); }
                    resolveConflicts(mine, theirs, function(resolved) {
                      put(key, resolved, cb);
                      next();
                    });
                  });
                } else {
                  err2 = new Error('Conflict');
                  err2.key = key;
                  err2.mine = mine;
                  err2.theirs = theirs;
                  return cb(err2);
                }
              } else {
                if (change.deleted) { remote_destroy(key); }
                else {
                  remote_put(key, theirs, function(err) {
                    if (err) { return cb(err); }
                    next();
                  });
                }
              }
            });
          } else {
            // finished
            pulled_since(body.last_seq, cb);
          }
        }());
      });
    });
  }
};function resolve_push_strategy(strat_name) {
  var strat;
  if ('function' === typeof(strat_name)) { strat = strat_name; }
  else {
    switch(strat_name) {
      case 'restful_ajax':
        strat = push_strategy_restful_ajax;
      break;
      default:
        throw new Error('Unknown push strategy: ' + strat_name);
    }
  }
  return strat;
}function push_strategy_restful_ajax() {
  
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
var that = new EventEmitter()
  , sync
  , store
  , pull_strategy
  , push_strategy;

options = options || {};


// ====  strategy resolving ~======

options.storage_strategy || (options.storage_strategy = 'idbstore');
store = resolve_storage_strategy(options.storage_strategy) (base_url);

options.pull_strategy || (options.pull_strategy = 'couchdb_bulk');
pull_strategy = resolve_pull_strategy(options.pull_strategy) ();

options.push_strategy || (options.push_strategy = 'restful_ajax');
push_strategy = resolve_push_strategy(options.push_strategy) ();

// ============================= DB manipulation  ~===

function meta_op(op, version) {
  var ret = {o:op};
  version && (ret[v] = version);
  return ret;
}

function unsynced_keys(cb) {
  return store.meta.all_keys(cb);
}

function unsynced_keys_iterator(cb, done) {
  store.meta.all_keys_iterator(cb, done);
}

function pulled_since(val, cb) {
  if (arguments.length < 2) { cb = val; val = undefined; }
  return store.pulled_since(val, cb);
}

function error_callback(err) {
  if (err) { that.emit('error', err); }
}

function put(key, value, callback) {
  if (arguments.length < 3) {
    if ('function' === typeof(value)) {
      callback = value;
      value = key;
      key = value.id || value._id || uuid();
    } else {
      callback = error_callback;
    }
  }
  
  if ('object' !== typeof(value)) { return callback(new Error("You can only put objects, not " + typeof(value))); }
  
  value.id || value._id || (value._id = key);
  store.ready(function(err) {
    if (err) { return callback(err); }
    store.doc.put(key, value, function(err) {
      if (err) { return callback(err); }
      store.meta.put(key, meta_op('p'), function(err) {
        if (err) { return callback(err); }
        callback(null, key);
      });
    });
  });
  return key;
}

function remote_put(key, value, cb) {
  if (! cb) { cb = error_callback; }
  store.ready(function(err) {
    if (err) { return cb(err); }
    store.doc.put(key, value, cb);
  });
}

function get(key, cb) {
  if (! cb) { cb = error_callback; }
  store.ready(function(err) {
    if (err) { return callback(err); }
    return store.doc.get(key, cb);
  });
}

function destroy(key, cb) {
  get(key, function(err, old) {
    if (err) { return cb(err); }
    store.ready(function(err) {
      if (err) { return cb(err); }
      store.doc.destroy(key, function(err, destroyed) {
        if (err) { return cb(err); }
        if (destroyed) {
          store.meta.put(key, meta_op('d', old && old._rev), cb);
        } else {
          cb();
        }
      });
    });
  });
}

function remote_destroy(key, cb) {
  store.ready(function(err) {
    if (err) { return cb(err); }
    store.doc.destroy(key, cb);
  });
}

function all(callback) {
  var ret = [];

  function cb(key, value, done) {
    ret.push(value);
    done();
  }
  
  function done(err) {
    if (err) { return callback(err); }
    callback(null, ret);
  }
  
  store.doc.all_keys_iterator(cb, done);
}

function nuke(cb) {
  if (! cb) { cb = error_callback; }
  store.ready(function(err) {
    if (err) { return cb(err); }
    (function(done) {
      store.doc.all_keys(function(err, keys) {
        if (err) { return cb(err); }
        var key, i = -1;
        (function next() {
          i += 1;
          if (i >= keys.length) {
           return done(); 
          }
          key = keys[i];
          store.doc.destroy(key, function(err) {
            if (err) { return cb(err); }
            next();
          });
        }());
      });
    } (function() {
      store.meta.all_keys(function(err, keys) {
        if (err) { return cb(err); }
        var key, i = -1;
        (function next() {
          i += 1;
          if (i >= keys.length) {
           return cb(); 
          }
          key = keys[i];
          store.meta.destroy(key, function(err) {
            if (err) { return cb(err); }
            next();
          });
        }());
      });
    }));
  });
}

// ======================= sync   ~==

function pull(resolveConflicts, cb) {
  store.ready(function(err) {
    if (err) { return cb(err); }
    pull_strategy(resolveConflicts, cb);
  });
}

function push(resolveConflicts, cb) {
  store.ready(function(err) {
    if (err) { return cb(err); }
    push_strategy(resolveConflicts, cb);
  });
}

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
      if (err && ! callback(err)) { syncEmitter.emit('error', err); }
    }

    push(resolveConflicts, function(err) {
      if (err) { return error(err); }
      pull(resolveConflicts, function(err) {
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

that.storageStrategy = store.stratName;
that.internalNAme    = store.internalName;
that.sync          = sync;
that.put           = put;
that.get           = get;
that.destroy       = destroy;
that.unsynced_keys = unsynced_keys;
that.all           = all;
that.nuke          = nuke;

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
}(function() {
  var strategies_order = ['idbstore', 'localstore', 'sessionstore', 'memstore'];
  var scannableStrategies = {
      idbstore   : function() { return 'undefined' !== typeof(window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB); }
    , localstore   : function() { return (typeof(window.localStorage) !== 'undefined'); }
    , sessionstore : function() { return (typeof(window.sessionStorage) !== 'undefined'); }
    , memstore     : function() { return true; }
  };
  
  function supportedStorageStrategies() {
    var strategies = []
      , detector
      , strat;

    for(strat in strategies_order) {
      strat = strategies_order[strat];
      detector = scannableStrategies[strat];
      if (detector()) { strategies.push(strat); }
    }
    return strategies;
  }
  
  dribbledb.supportedStorageStrategies = supportedStorageStrategies;
}());}());
