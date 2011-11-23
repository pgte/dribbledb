# dribbledb

## API

### Instantiate a dribbledb:

    var db = dribbledb('http://myhost.com/posts');

The first and only argument must be the base URL for a RESTful webservice that accepts requests like:

    PUT http://myhost.com/posts
    GET http://myhost.com/posts/1
    POST http://myhost.com/posts/1
    DELETE http://myhost.com/posts/1

### put:

    db.put('key', 'value');

### get:

    var value = db.get('key');

### destroy:

    db.destroy('key');

### all:

This returns all stored objects;

    db.all();

You can also iterate on each stored object by using db.all(iterator):

    db.all(function(obj) {
      console.log('got one object:', obj);
    });

You can also add a second argument to know when the iteration is finished:

    db.all(function(obj) {
      console.log('got one object:', obj);
    }), function() {
      console.log('iteration ended');
    });

### nuke:

Remove the entire database, but just locally.
Also removes all syncing pending stuff, so your remote object don't get removed.

    db.nuke();

### sync:

    db.sync(function(err) {
      if (err) { return throw err; }
    });

If you like you can omit the callback. In that case, if an error is caught, db.sync will emit an "error" event.

### solving conflicts when syncing:

    function resolveConflict(myVerDoc, theirVerDoc, solved) {
      solved(this.merge(myVerDoc, theirVerDoc));
    };

    db.sync(resolveConflict, function(err) {
      if (err) { return throw err; }
    });

### callbacks when syncing:

#### "error"

    db.sync.on('error', function(err) {
      console.log('Error caught: ' + err.message);
    });

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

    db.sync.on('notify', function(key, value, operation) {
      console.log('key ' + key + ' was changed on remote: ' + operation);
    });

The 3rd argument contains the remote operation and can have the following values:

* "updated"
* "inserted"
* "destroyed"