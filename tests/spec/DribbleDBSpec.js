describe('DribbleDB', function() {
  var dbd = window.dribbledb;
  
  function removeOne(store) {
    var i, key;
    for(i=0; i < store.length; i++) {
      key = store.key(i);
      store.removeItem(key);
    }
  }
  
  function removeAll() {
    removeOne(window.localStorage);
    removeOne(window.sessionStorage);
  }
  
  beforeEach(removeAll);
  
  it("should exist", function() {
    expect(dbd).toBeDefined();
  });
  
  it("should support feature detection", function() {
    expect(dbd.supportedStorageStrategies()).toEqual(['localstore', 'sessionstore', 'memstore']);
  });
  
  it("should have a version number", function() {
    expect(dbd.version).toBeDefined();
    expect(dbd.version).toNotEqual('@VERSION');
  });
  
  it("should be able to produce db instances", function() {
    var db = dbd('http://foo.com/posts');
    expect(db).toBeTruthy();
  });
  
  describe("when a dribbledb has been instantiated", function() {
    var db = dbd('http://foo.com/posts');
    console.log('db', db);
    expect(db.storageStrategy).toEqual('localstore');
    
    it("should be able to put a string and get it back", function() {
      db.put('a', 'abc');
      expect(db.get('a')).toEqual('abc');
    });

    it("should be able to store and retrieve objects", function() {
      db.put('b', {a: 1, b : 2});
      expect(db.get('b')).toEqual({a: 1, b : 2, _id: 'b'});
    });
    
    it("should be able to remove by key", function() {
      db.put("c", 1);
      expect(db.get("c")).toEqual(1);
      db.destroy("c")
      expect(db.get("c")).toBeNull();
    });
    
  });
  
  describe("when a dribbledb using sessionstore has been instantiated", function() {
    var db = dbd('http://foo.com/sessionposts', {storage_strategy: 'sessionstore'});
    
    expect(db.storageStrategy).toEqual('sessionstore');
    
    it("should be able to put a string and get it back", function() {
      db.put('a', 'abc');
      expect(db.get('a')).toEqual('abc');
    });

    it("should be able to store and retrieve objects", function() {
      db.put('b', {a: 1, b : 2});
      expect(db.get('b')).toEqual({a: 1, b : 2, _id: 'b'});
    });
    
    it("should be able to remove by key", function() {
      db.put("c", 1);
      expect(db.get("c")).toEqual(1);
      db.destroy("c")
      expect(db.get("c")).toBeNull();
    });
    
  });

  describe("when a dribbledb using memstore has been instantiated", function() {
    var db = dbd('http://foo.com/memposts', {storage_strategy: 'memstore'});
    
    expect(db.storageStrategy).toEqual('memstore');
    
    it("should be able to put a string and get it back", function() {
      db.put('a', 'abc');
      expect(db.get('a')).toEqual('abc');
    });

    it("should be able to store and retrieve objects", function() {
      db.put('b', {a: 1, b : 2});
      expect(db.get('b')).toEqual({a: 1, b : 2, _id: 'b'});
    });
    
    it("should be able to remove by key", function() {
      db.put("c", 1);
      expect(db.get("c")).toEqual(1);
      db.destroy("c")
      expect(db.get("c")).toBeNull();
    });
    
  });
  
  describe("when you have a db just for yourself", function() {
    var db = dbd('http://foo.com/posts2');
    it("should be able to tell me which keys have not yet been synced", function() {
      var unsynced;
      db.put("a", 1);
      db.put("b", 2);
      db.put("c", 3);
      unsynced = db.unsynced_keys();
      expect(unsynced.length).toEqual(3);
      expect(unsynced).toContain("a");
      expect(unsynced).toContain("b");
      expect(unsynced).toContain("c");
    });
  });

  describe("when you have a second db just for yourself", function() {
    var db = dbd('http://foo.com/posts2');
    it("should be able to tell me which keys have not yet been synced", function() {
      var unsynced;
      var id = db.put(1);
      expect(db.get(id)).toEqual(1);
    });
  });

  describe("when you have a shumble db just for yourself", function() {
    var db = dbd('http://foo.com/shumble');
    it("it should be able to iterate over all the keys", function() {
      var all;
      
      db.put("a", {a:1});
      db.put("b", {b:2});
      db.put("c", {c:3});
      
      all = db.all();
      
      expect(all).toBeDefined();
      expect(all).toContain({a:1, _id: 'a'});
      
      (function() {
        var called = 0;
        var callback = function(key, value, next) {
          called += 1;
          next();
        }
        db.all(callback);
        expect(called).toEqual(3);
      }());

      (function() {
        var called = 0
          , finished = false

        var callback = function(key, value, next) {
          called += 1;
          next();
        }
        
        var done = function() { finished = true; }
        db.all(callback, done);
        expect(called).toEqual(3);
        expect(finished).toEqual(true);
      }());

    });
  });
  
  describe("when you have a shumble 2 db just for yourself", function() {
    var db = dbd('http://foo.com/shumble2');
    it("it should be able to nuke everything", function() {
      var all;
      
      db.put("a", {a:1});
      db.put("b", {b:2});
      db.put("c", {c:3});
      
      expect(db.nuke()).toEqual(true);
      expect(db.all().length).toEqual(0);
      expect(db.unsynced_keys.length).toEqual(0);
    });
  });

  describe("when you have a second db just for yourself", function() {
    var db = dbd('http://foo.com/posts2');
    it("should be able to tell me which keys have not yet been synced", function() {
      var unsynced;
      var id = db.put(1);
      expect(db.get(id)).toEqual(1);
    });
  });

  describe("when you have another db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables');
    
    beforeEach(function() {
      this.xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];
      this.xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      this.xhr.restore();
    });
    
    it("should try to sync the unsynced actions", function() {
      var unsynced
        , callback = sinon.spy()

      db.put("a", 1);
      db.put("b", 2);
      db.put("c", 3);
      db.destroy("b");
      db.sync(callback);
      for(var i = 0; i < 4; i ++) {
        expect(this.requests.length).toEqual(i + 1);
        this.requests[i].respond(201, {}, '{}');
      }
      expect(callback.calledWith()).toEqual(true);
      expect(db.unsynced_keys.length).toEqual(0);
    });
  });
  
  describe("when you have yet another db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables2');
    
    beforeEach(function() {
      this.xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];
      this.xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      this.xhr.restore();
    });
    
    it("should be able to detect conflicts", function() {
      var unsynced
        , callback = sinon.spy()

      db.put("a", 1);
      db.sync(callback);
      
      expect(callback.callCount).toEqual(0);
      expect(this.requests.length).toEqual(1);
      this.requests[0].respond(409, {}, '{}');
      expect(this.requests.length).toEqual(2);
      this.requests[1].respond(200, {'Content-Type': 'application/json'}, '2');
      expect(callback.called).toEqual(true);
      expect(callback.callCount).toEqual(1);
      expect(callback.getCall(0).args.length).toEqual(1);
      expect(callback.getCall(0).args[0] instanceof Error).toEqual(true);
      expect(callback.getCall(0).args[0].mine).toEqual(1);
      expect(callback.getCall(0).args[0].theirs).toEqual(2);
    });
  });

  describe("when you have yet another second db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables3');
    
    beforeEach(function() {
      this.xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];
      this.xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      this.xhr.restore();
    });
    
    it("should be able to resolve conflicts", function() {
      var unsynced
        , resolveConflictCalled = false
        , callback = sinon.spy()

      function resolveConflict(a, b, done) {
        resolveConflictCalled = true;
        done(3);
      }

      db.put("a", 1);
      db.sync(resolveConflict, callback);
      
      expect(callback.callCount).toEqual(0);
      expect(this.requests.length).toEqual(1);
      this.requests[0].respond(409, {}, '{}');
      expect(this.requests.length).toEqual(2);
      this.requests[1].respond(200, {'Content-Type': 'application/json'}, '2');
      expect(resolveConflictCalled).toEqual(true);

      expect(this.requests.length).toEqual(3);
      this.requests[2].respond(201, {}, '{}');

      expect(this.requests.length).toEqual(4);
      this.requests[3].respond(200, {'Content-Type': 'application/json'}, '{"results":[], "last_seq":0}');

      expect(callback.called).toEqual(true);
      expect(callback.callCount).toEqual(1);
      expect(callback.getCall(0).args.length).toEqual(0);
      expect(db.get("a")).toEqual(3);
    });
  });

  describe("when you have yet another third db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables4');
    
    beforeEach(function() {
      this.xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];
      this.xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      this.xhr.restore();
    });
    
    it("should be able to pull changes from remote", function() {
      var callback = sinon.spy()

      db.sync(callback);
      
      expect(this.requests.length).toEqual(1);
      this.requests[0].respond(200, {'Content-Type': 'application/json'}, '{"results":[{"id":"a","doc":1},{"id":"b","doc":2}], "last_seq":2}');

      expect(callback.called).toEqual(true);
      expect(callback.callCount).toEqual(1);
      expect(callback.getCall(0).args.length).toEqual(0);
      expect(db.get("a")).toEqual(1);
      expect(db.get("b")).toEqual(2);
    });
  });

});