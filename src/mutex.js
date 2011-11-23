function Mutex() {
  var locked = false
    , _queue = [];
  
  function queue(command) {
    _queue.push(command);
  }

  function dequeue() {
    var command = _queue.shift();
    if (command) {
      _do(command);
    }
  }
  
  function _do(command) {
    console.log('doing');
    locked = true;
    command(function(done) {
      console.log('done'); 
      locked = false;
      if ('function' === typeof(done)) { done(); }
      dequeue();
    });
  }

  function sync(command) {
    if (! locked) {
      _do(command);
    } else {
      queue(command);
    }
  }

  return { sync: sync };
}