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
}()).v4;