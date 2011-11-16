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