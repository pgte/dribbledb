# dribbledb

## API

### Instantiate a dribbledb:

    var db = dribbledb('http://myhost.com');

### put:

    db.put('key', 'value');

### get:

    var value = db.get('key');

### sync:

    db.sync(function(err) {
      if (err) { return throw err; }
    });

### solving conflicts when syncing:

    function resolveConflict(myVerDoc, theirVerDoc, solved) {
      solved(this.merge(myVerDoc, theirVerDoc));
    };

    db.sync(resolveConflict, function(err) {
      if (err) { return throw err; }
    });

### callbacks when syncing:

#### "start"

    db.sync.on('start', function() {
      console.log('sync started');
    });

#### "end"

    db.sync.on('end', function() {
      console.log('sync ended');
    });

#### "before_save"

    db.sync.on('before_save', function(key, value) {
      console.log('key ' + key + ' is being saved to remote');
    });

#### "after_save"

    db.sync.on('after_save', function(key, value) {
      console.log('key ' + key + ' was successfully saved to remote');
    });

#### "notify"

    db.sync.on('notify', function(key, value) {
      console.log('key ' + key + ' was updated on remote');
    });