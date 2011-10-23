(function() {
  var root             = this
    , previous_dribble = root.dribbledb
    , dribbledb        = {}
    , TIMESTAMPS       = '/_internals/timestamps'
    , IINDEX           = '/_internals/inverted-index'
    , STORAGE_NS       = '/dribbledb/'
    ;

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
      if(typeof document === 'object') {
        document = JSON.stringify(document);
      }
      root.localStorage.setItem(path,document);
      return cb();
    }
  
    function browser_destroy(path,cb) {
      root.localStorage.removeItem(path);
      return cb();
    }
  
    if(!root.localStorage) {
      // Don't like it? Fork it and send in a pull request.
      throw new Error('At the moment this only works in modern browsers'); 
    }
    return { get     : browser_get
           , put     : browser_put
           , destroy : browser_destroy
           };
  }
  
  function node_store() {
    function node_get(path) {
      throw Error('Not Implemented');
    }
  
    function node_put(path,document) {
      if(typeof document === 'object') {
        document = JSON.stringify(document);
      }
      throw Error('Not Implemented');
    }
  
    function node_destroy(path) {
      throw Error('Not Implemented');
    }
  
    return { get     : node_get
           , put     : node_put
           , destroy : node_delete
           };
  }

  // credit: https://github.com/broofa/node-uuid
  // MIT Licensed
  //
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
    return tos[b[0]] + tos[b[1]] + tos[b[2]] + tos[b[3]] +
           tos[b[4]] + tos[b[5]] +
           tos[b[6]] + tos[b[7]] +
           tos[b[8]] + tos[b[9]] +
           tos[b[10]] + tos[b[11]] + tos[b[12]] +
           tos[b[13]] + tos[b[14]] + tos[b[15]];
  }

  var ff = 0xff;

  // Feature detect for the WHATWG crypto API. See
  // http://wiki.whatwg.org/wiki/Crypto
  var useCrypto = this.crypto && crypto.getRandomValues;
  var rnds = useCrypto ? new Uint32Array(4) : new Array(4);

  function uuid(fmt, buf, offset) {
    var b = fmt != 'binary' ? _buf : (buf ? buf : new BufferClass(16));
    var i = buf && offset || 0;

    if (useCrypto) {
      crypto.getRandomValues(rnds);
    } else {
      rnds[0] = Math.random()*0x100000000;
      rnds[1] = Math.random()*0x100000000;
      rnds[2] = Math.random()*0x100000000;
      rnds[3] = Math.random()*0x100000000;
    }

    var r = rnds[0];
    b[i++] = r & ff;
    b[i++] = r>>>8 & ff;
    b[i++] = r>>>16 & ff;
    b[i++] = r>>>24 & ff;
    r = rnds[1];
    b[i++] = r & ff;
    b[i++] = r>>>8 & ff;
    b[i++] = r>>>16 & 0x0f | 0x40; // See RFC4122 sect. 4.1.3
    b[i++] = r>>>24 & ff;
    r = rnds[2];
    b[i++] = r & 0x3f | 0x80; // See RFC4122 sect. 4.4
    b[i++] = r>>>8 & ff;
    b[i++] = r>>>16 & ff;
    b[i++] = r>>>24 & ff;
    r = rnds[3];
    b[i++] = r & ff;
    b[i++] = r>>>8 & ff;
    b[i++] = r>>>16 & ff;
    b[i++] = r>>>24 & ff;

    return fmt === undefined ? unparse(b) : b;
  }

  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;
  // end of credit: https://github.com/broofa/node-uuid

  dribbledb.uuid = uuid;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = dribbledb;
    }
    exports.dribbledb = dribbledb;
    exports.dribbledb.internals = { store: node_store() };
  } 
  else if (typeof define === 'function' && define.amd) {
    define('dribbledb', function() {
      dribbledb.internals = { store: browser_store() };
      return dribbledb;
    });
  } 
  else {
    dribbledb.internals = {store: browser_store()};
    root.dribbledb = dribbledb;
  }

  dribbledb.version = '0.0.1';
  //dribbledb.put = function dribble_put(database, path, document, params, cb) {
  //  var directory   = extract_directory(path)
  //    , collections = params.collections ? params.collections : []
  //    , user        = params.user
  //    , revision    = params.revision
  //    , uri         = STORAGE_NS + database + '/' + path
  //    ;
  //  dribbledb.internals.timestamp(
  //    function (ts) {
  //      dribbledb.internals.current_document_revision(uri,
  //        function(current_rev) {
  //          if(current_rev > revision) {
  //            return cb(new Error('conflict'));
  //        }
  //      });
  //  });
  //};
})();