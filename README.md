# DribbleDB

DribbleDB is a browser local store capable of remote syncing.

It supports several storage strategies and remote pushing and pulling strategies.

It works with CouchDB-style APIs and a lot more to come.

## API

### Instantiate a dribbledb:

    var db = dribbledb('http://myhost.com/posts');

You can also pass some options on the second argument like this:

    var db = dribbledb('http://myhost.com/posts', options);

#### Options:

* store_strategy:
  * localstore (default) : Use localstore
* pull_strategy: can take any of the following values:
  * couchdb_bulk (default) : Use CouchDB-like _changes feed (server should accept since=x querystring argument)
* push_strategy
  * restful_ajax : Use RESTful webservice that obey this scheme:
    * PUT http://myhost.com/posts
    * GET http://myhost.com/posts/1
    * POST http://myhost.com/posts/1
    * DELETE http://myhost.com/posts/1

(For browser compatibility see the feature detection section below).

## Storage API

### put:

    db.put('key', 'value', [callback(err, id)]);

Or you can just provide the value:

    db.put(obj, [callback(err, id)]);

Returns the id of the object.

If `obj` has an `_id` or `id` attribute, then no new value is created.

If it does not, a new ID is created (using node-uuid).

When an object is stored and doesn't have an `_id` or `id` attribute, an attribute named `_id` is created with the key value.


### get:

    var value = db.get('key', callback[(err, object)]);

### destroy:

    db.destroy('key'[, callback(err)]);

### all:

This returns all stored objects;

    db.all(callback(err, all_docs));

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

    db.nuke([callback(err)]);

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

### Database Events:

#### "error"

    db.on('error', function(err) {
      console.log('Error caught: ' + err.message);
    });

### Events when syncing:

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

### Feature detection

#### Storage

You can query the supported strategies for the current browser:

    var supportedStorageStrategies = dribbledb.supportedStorageStrategies();

Current strategies scanned are, and will be returned in this order:

* `localstorage`
* `sessionstorage`


