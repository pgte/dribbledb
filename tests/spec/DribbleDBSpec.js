this.XMLHttpRequest = undefined;
describe('DribbleDB', function() {
  var dbd = window.dribbledb
    , assert = sinon.assert;
  
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
  
  it("should exist", function(done) {
    expect(dbd).toBeDefined();
    done();
  });
  
  it("should support feature detection", function(done) {
    expect(dbd.supportedStorageStrategies()).toEqual(['idbstore', 'localstore', 'sessionstore', 'memstore']);
    done();
  });
  
  it("should have a version number", function(done) {
    expect(dbd.version).toBeDefined();
    expect(dbd.version).toNotEqual('@VERSION');
    done();
  });
  
  it("should be able to produce db instances", function(done) {
    var db = dbd('http://foo.com/posts');
    expect(db).toBeDefined();
    done();
  });
  
  describe("when a dribbledb has been instantiated", function() {
    var db = dbd('http://foo.com/posts');
    console.log('db', db);
    expect(db.storageStrategy).toEqual('localstore');
    
    it("should be able to put a string and get it back", function(done) {
      db.put('a', 'abc', function(err, id) {
        expect(err).toBeNull();
        expect(id).toEqual('a');
        db.get('a', function() {
          
        });
      });
      expect(db.get('a', function(err, val) {
        expect(err).toBeNull();
        expect(val).toEqual('abc');
        done();
      }));
    });

    it("should be able to store and retrieve objects", function(done) {
      db.put('b', {a: 1, b : 2}, function(err) {
        db.get('b', function(err, val) {
          expect(err).toBeNull();
          expect(val).toEqual({a: 1, b : 2, _id: 'b'});
          done();
        });
      });
    });
    
    it("should be able to remove by key", function(done) {
      db.put("c", 1, function(err) {
        expect(err).toBeNull();
        db.get("c", function(err, val) {
          expect(err).toBeNullOrUndefined();
          expect(val).toEqual(1);
          db.destroy("c", function(err) {
            expect(err).toBeNullOrUndefined();
            db.get("c", function(val) {
              expect(val).toBeNull();
              done();
            });
          });
        });
      });
    });
    
  });
  
  describe("when a dribbledb using sessionstore has been instantiated", function() {
    var db = dbd('http://foo.com/sessionposts', {storage_strategy: 'sessionstore'});
    
    expect(db.storageStrategy).toEqual('sessionstore');
    
    it("should be able to put a string and get it back", function(done) {
      db.put('a', 'abc', function(err) {
        expect(err).toBeNull();
        db.get('a', function(err, val) {
          expect(err).toBeNullOrUndefined();
          expect(val).toEqual('abc');
          done();
        });
      });
    });

    it("should be able to store and retrieve objects", function(done) {
      db.put('b', {a: 1, b : 2}, function(err) {
        expect(err).toBeNullOrUndefined();
        db.get('b', function(err, val) {
          expect(val).toEqual({a: 1, b : 2, _id: 'b'});
          done();
        });
      });
    });
    
    it("should be able to remove by key", function(done) {
      db.put("c", 1, function(err) {
        expect(err).toBeNullOrUndefined();
        db.get("c", function(err, val) {
          expect(err).toBeNullOrUndefined();
          expect(val).toEqual(1);
          db.destroy("c", function(err) {
            expect(err).toBeNullOrUndefined();
            db.get("c", function(err, val) {
              expect(err).toBeNullOrUndefined();
              expect(val).toBeNull();
              done();
            })
          });
        });
      });
    });
    
  });

  describe("when a dribbledb using memstore has been instantiated", function() {
    var db = dbd('http://foo.com/memposts', {storage_strategy: 'memstore'});
    
    expect(db.storageStrategy).toEqual('memstore');
    
    it("should be able to put a string and get it back", function(done) {
      db.put('a', 'abc', function(err) {
        console.log(111);
        expect(err).toBeNullOrUndefined();
        db.get('a', function(err, val) {
          console.log(222);
          expect(err).toBeNullOrUndefined();
          expect(val).toEqual('abc');
          done();
        });
      });
    });

    it("should be able to store and retrieve objects", function(done) {
      db.put('b', {a: 1, b : 2}, function(err) {
        expect(err).toBeNullOrUndefined();
        db.get('b', function(err, val) {
          expect(err).toBeNullOrUndefined();
          expect(val).toEqual({a: 1, b : 2, _id: 'b'});
          done();
        })
      });
    });
    
    it("should be able to remove by key", function(done) {
      db.put("c", 1, function(err) {
        expect(err).toBeNullOrUndefined();
        db.get("c", function(err, val) {
          expect(err).toBeNullOrUndefined();
          expect(val).toEqual(1);
          db.destroy("c", function(err) {
            expect(err).toBeNullOrUndefined();
            db.get("c", function(err, val) {
              expect(err).toBeNullOrUndefined();
              expect(val).toBeNull();
              done();
            });
          });
        })
      });
    });
    
  });
  
  // describe("when a dribbledb using idb has been instantiated", function() {
  //   var db = dbd('http://foo.com/idbposts', {storage_strategy: 'idbstore'});
  //   
  //   expect(db.storageStrategy).toEqual('idbstore');
  //   
  //   it("should be able to put a string and get it back", function(done) {
  //     db.put('a', 'abc');
  //     expect(db.get('a')).toEqual('abc');
  //     done();
  //   });
  // 
  //   it("should be able to store and retrieve objects", function(done) {
  //     db.put('b', {a: 1, b : 2});
  //     expect(db.get('b')).toEqual({a: 1, b : 2, _id: 'b'});
  //     done();
  //   });
  //   
  //   it("should be able to remove by key", function(done) {
  //     db.put("c", 1);
  //     expect(db.get("c")).toEqual(1);
  //     db.destroy("c")
  //     expect(db.get("c")).toBeNull();
  //     done();
  //   });
  //   
  // });
  
  describe("when you have a db just for yourself", function() {
    var db = dbd('http://foo.com/posts2');
    it("should be able to tell me which keys have not yet been synced", function(done) {
      var unsynced;
      db.put("a", 1, function(err) {
        expect(err).toBeNullOrUndefined();
        db.put("b", 2, function(err) {
          expect(err).toBeNullOrUndefined();
          db.put("c", 3, function(err) {
            expect(err).toBeNullOrUndefined();
            db.unsynced_keys(function(err, unsynced) {
              expect(err).toBeNullOrUndefined();
              expect(unsynced.length).toEqual(3);
              expect(unsynced).toContain("a");
              expect(unsynced).toContain("b");
              expect(unsynced).toContain("c");
              done();
            });
          });
        });
      });
    });
  });

  describe("when you have a second db just for yourself", function() {
    var db = dbd('http://foo.com/posts2');
    it("should be able to tell me which keys have not yet been synced", function(done) {
      var unsynced;
      db.put(2, function(err, id) {
        expect(err).toBeNullOrUndefined();
        expect(id).toBeDefined();
        db.get(id, function(err, val) {
          expect(val).toEqual(2);
          done();
        });
      });
    });
  });

  describe("when you have a shumble db just for yourself", function() {
    var db = dbd('http://foo.com/shumble');
    it("it should be able to iterate over all the keys", function(done) {
      var all;
      
      db.put("a", {a:1}, function(err) {
        expect(err).toBeNullOrUndefined();
        db.put("b", {b:2}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.put("c", {c:3}, function(err) {
            expect(err).toBeNullOrUndefined();
            db.all(function(err, all) {
              expect(err).toBeNullOrUndefined();
              expect(all).toBeDefined();
              expect(all).toContain({a:1, _id: 'a'});
              expect(all).toContain({b:2, _id: 'b'});
              expect(all).toContain({c:3, _id: 'c'});
              done();
            });
          });
        });
      });
    });
  });
  
  describe("when you have a shumble 2 db just for yourself", function() {
    var db = dbd('http://foo.com/shumble2');
    it("it should be able to nuke everything", function(done) {
      var all;
      
      db.put("a", {a:1}, function(err) {
        expect(err).toBeNullOrUndefined();
        db.put("b", {b:2}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.put("c", {c:3}, function(err) {
            expect(err).toBeNullOrUndefined();
            db.nuke(function(err) {
              expect(err).toBeNullOrUndefined();
              db.all(function(err, all) {
                expect(err).toBeNullOrUndefined();
                expect(all.length).toEqual(0);
                db.unsynced_keys(function(err, unsynced_keys) {
                  expect(err).toBeNullOrUndefined();
                  expect(unsynced_keys.length).toEqual(0);
                  done();
                });
              })
            })
          });
        });
      });
      
    });
  });

  describe("when you have another db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables');
    var xhr, requests;
    
    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];
      xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      xhr.restore();
    });
    
    it("should try to sync the unsynced actions", function(done) {
      var unsynced
        , callback = sinon.spy()

      db.put("a", 1, function(err) {
        expect(err).toBeNullOrUndefined();
        db.put("b", 2, function(err) {
          expect(err).toBeNullOrUndefined();
          db.put("c", 3, function(err) {
            db.destroy("b", function(err) {
              expect(err).toBeNullOrUndefined();
              db.sync(callback);
              for(var i = 0; i < 4; i ++) {
                expect(requests.length).toEqual(i + 1);
                requests[i].respond(201, {}, '{}');
              }
              expect(callback.calledWith()).toEqual(true);
              db.unsynced_keys(function(err, unsyncked_keys) {
                expect(err).toBeNullOrUndefined();
                expect(unsyncked_keys.length).toEqual(0)
                done();
              });
            });
          });
        });
      });
    });
  });
  
  describe("when you have yet another db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables2');
    var xhr, requests;
    
    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      requests  = [];
      xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      xhr.restore();
    });
    
    it("should be able to detect conflicts", function(done) {
      var unsynced
        , callback = sinon.spy()
        , error;

      db.put("a", 1);
      db.sync(callback);
      
      expect(callback.callCount).toEqual(0);
      expect(requests.length).toEqual(1);
      requests[0].respond(409, {}, '{}');
      expect(requests.length).toEqual(2);
      requests[1].respond(200, {'Content-Type': 'application/json'}, '2');
      expect(callback.called).toEqual(true);
      expect(callback.callCount).toEqual(1);
      expect(callback.getCall(0).args.length).toEqual(1);
      error = callback.getCall(0).args[0]; 
      expect(error instanceof Error).toEqual(true);
      expect(error.message).toEqual('Conflict');
      expect(error.mine).toEqual(1);
      expect(error.theirs).toEqual(2);
      done();
    });
  });

  describe("when you have yet another second db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables3');
    var xhr, requests;
    
    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];
      xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      xhr.restore();
    });
    
    it("should be able to resolve conflicts", function(done) {
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
      expect(requests.length).toEqual(1);
      requests[0].respond(409, {}, '{}');
      expect(requests.length).toEqual(2);
      requests[1].respond(200, {'Content-Type': 'application/json'}, '2');
      expect(resolveConflictCalled).toEqual(true);

      expect(requests.length).toEqual(3);
      requests[2].respond(201, {}, '{}');

      expect(requests.length).toEqual(4);
      requests[3].respond(200, {'Content-Type': 'application/json'}, '{"results":[], "last_seq":0}');

      expect(callback.called).toEqual(true);
      expect(callback.callCount).toEqual(1);
      expect(callback.getCall(0).args.length).toEqual(0);
      db.get("a", function(err, val) {
        expect(err).toBeNullOrUndefined();
        expect(val).toEqual(3);
        done();
      });
    });
  });

  describe("when you have yet another third db just for yourself where you have overriden request", function() {
    var db = dbd('http://foo.com/syncables4');
    var xhr, requests;
    
    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];
      xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    });
    
    afterEach(function() {
      xhr.restore();
    });    

    it("should be able to pull changes from remote", function(done) {
      var callback = sinon.spy()

      db.sync(callback);
      
      expect(requests.length).toEqual(1);
      requests[0].respond(200, {'Content-Type': 'application/json'}, '{"results":[{"id":"a","doc":1},{"id":"b","doc":2}], "last_seq":2}');

      expect(callback.called).toEqual(true);
      expect(callback.callCount).toEqual(1);
      expect(callback.getCall(0).args.length).toEqual(0);
      db.get("a", function(err, val) {
        expect(err).toBeNullOrUndefined();
        expect(val).toEqual(1);
        db.get("b", function(err, val) {
          expect(err).toBeNullOrUndefined();
          expect(val).toEqual(2);
          done();
        });
      });
    });
  });
});