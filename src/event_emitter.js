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

