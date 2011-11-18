describe('DribbleDB', function() {
  var dbd = window.dribbledb;
  
  (function() {
    var i, key;
    for(i=0; i < localStorage.length; i++) {
      key = localStorage.key(i);
      localStorage.removeItem(key);
    }
  }());
  
  it("should exist", function() {
    expect(dbd).toBeDefined();
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
    
    it("should be able to put a string and get it back", function() {
      db.put('a', 'abc');
      expect(db.get('a')).toEqual('abc');
    });

    it("should be able to store and retrieve objects", function() {
      db.put('b', {a: 1, b : 2});
      expect(db.get('b')).toEqual({a: 1, b : 2});
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
      db.put("c", 3);
      db.destroy("b");
      db.sync(callback);
      for(var i = 0; i < 3; i ++) {
        expect(this.requests.length).toEqual(i + 1);
        this.requests[i].respond(201, {}, '');
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
      this.requests[0].respond(409, {}, '');
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

});