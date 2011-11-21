function remote(method, uri, body, cb) {
  if ('function' === typeof(arguments[2])) { cb = body; body = undefined; }
  request[method](uri, body)
    .expectResponseType('json')
    .end(cb);
}
function remote_get(uri, cb) {
  remote('get', uri, undefined, cb);
}

