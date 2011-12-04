this.XMLHttpRequest = undefined;
describe('DribbleDB', function() {
  var dbd = window.dribbledb
    , idb_dbs = []
    , idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB
    , assert = sinon.assert
  ;
  
  function openDB(name, type) {
    var opts;
    if (type) { opts = {storage_strategy: type}; }
    var db = dbd(name, opts);
    if ('idbstore' === db.storageStrategy) {
      idb_dbs.push(db.internalName);
      var done = false;
      var pending = [];
      db.ready = function(cb) {
        if (done) { cb(); }
        else { pending.push(cb); }
      }
      db.nuke(function(err) {
        done = true;
        if (err) { throw err; }
        for (var i = 0; i < pending.length; i ++) {
          pending[i]();
        }
      });
    } else {
      db.ready = function(cb) { cb(); }
    }
    return db;
  }
  
  function idb_removeOne(db, done) {
    db.nuke(done);
  }

  function removeOne(store) {
    var i, key;
    for(i=0; i < store.length; i++) {
      key = store.key(i);
      store.removeItem(key);
    }
  }
  
  function removeAll(done) {
    if (window.localStorage) { removeOne(window.localStorage); }
    if (window.sessionStorage) { removeOne(window.sessionStorage); }
    if (false && idb) {
      var i = -1;
      (function next() {
        i += 1;
        if (i >= idb_dbs.length) { return done(); }
        var db = idb_dbs[i];
        idb_removeOne(db, next);
      }());
    } else {
      done();
    }
  }
  
  beforeEach(removeAll);
  afterEach(removeAll);
  
  describe('stuff happens',  function() {
    var db = openDB('http://foo.com/posts');
    
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
      db.ready(function() {
        expect(db).toBeDefined();
        done();
      });
    });
  });
  
  
  describe("when a dribbledb has been instantiated", function() {
    var db = openDB('http://foo.com/postsABC');
    expect(db.storageStrategy).toEqual('idbstore');
    
    it("should be able to put a string and get it back", function(done) {
      db.ready(function() {
        db.put('a', {a: 'abc'}, function(err, id) {
          expect(err).toBeNull();
          expect(id).toEqual('a');
          db.get('a', function(err, val) {
            expect(err).toBeNullOrUndefined();
            expect(val).toEqual({a: 'abc', _id: 'a'});
            done();
          });
        });
      })
    });
  
    it("should be able to store and retrieve objects", function(done) {
      db.ready(function() {
        db.put('b', {a: 1, b : 2}, function(err) {
          db.get('b', function(err, val) {
            expect(err).toBeNull();
            expect(val).toEqual({a: 1, b : 2, _id: 'b'});
            done();
          });
        });
      });
    });
    
    it("should be able to remove by key", function(done) {
      db.ready(function() {
        db.put("c", {a:1}, function(err) {
          expect(err).toBeNull();
          db.get("c", function(err, val) {
            expect(err).toBeNullOrUndefined();
            expect(val).toEqual({a:1, _id:'c'});
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
  });
  
  describe("when a dribbledb using sessionstore has been instantiated", function() {
    var db = openDB('http://foo.com/sessionposts', 'sessionstore');
    
    expect(db.storageStrategy).toEqual('sessionstore');
    
    it("should be able to put a string and get it back 2", function(done) {
      db.ready(function() {
        db.put('a', {a: 'abc'}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.get('a', function(err, val) {
            expect(err).toBeNullOrUndefined();
            expect(val).toEqual({a: 'abc', _id:"a"});
            done();
          });
        });
      });
    });
  
    it("should be able to store and retrieve objects", function(done) {
      db.ready(function() {
        db.put('b', {a: 1, b : 2}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.get('b', function(err, val) {
            expect(val).toEqual({a: 1, b : 2, _id: 'b'});
            done();
          });
        });
      });
    });
    
    it("should be able to remove by key", function(done) {
      db.ready(function() {
        db.put("c", {a:1}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.get("c", function(err, val) {
            expect(err).toBeNullOrUndefined();
            expect(val).toEqual({a:1,_id:'c'});
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
  });
  
  describe("when a dribbledb using memstore has been instantiated", function() {
    var db = openDB('http://foo.com/memposts', 'memstore');
    
    expect(db.storageStrategy).toEqual('memstore');
    
    it("should be able to put a string and get it back", function(done) {
      db.ready(function() {
        db.put('a', {a:1}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.get('a', function(err, val) {
            expect(err).toBeNullOrUndefined();
            expect(val).toEqual({a:1,_id:'a'});
            done();
          });
        });
      });
    });
  
    it("should be able to store and retrieve objects", function(done) {
      db.ready(function() {
        db.put('b', {a: 1, b : 2}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.get('b', function(err, val) {
            expect(err).toBeNullOrUndefined();
            expect(val).toEqual({a: 1, b : 2, _id: 'b'});
            done();
          })
        });
      });
    });
    
    it("should be able to remove by key", function(done) {
      db.ready(function() {
        db.put("c", {a:1}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.get("c", function(err, val) {
            expect(err).toBeNullOrUndefined();
            expect(val).toEqual({a:1,_id:'c'});
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
  });
  
  describe("when you have a db just for yourself", function() {
    var db = openDB('http://foo.com/posts2');
  
    it("should be able to tell me which keys have not yet been synced", function(done) {
      var unsynced;
      db.ready(function() {
        db.put("a", {a:1}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.put("b", {b:2}, function(err) {
            expect(err).toBeNullOrUndefined();
            db.put("c", {c:3}, function(err) {
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
  });
  
  describe("when you have a second db just for yourself", function() {
    var db = openDB('http://foo.com/posts2');
  
    it("should be able to tell me which keys have not yet been synced", function(done) {
      var unsynced;
      db.ready(function() {
        db.put({a:1}, function(err, id) {
          expect(err).toBeNullOrUndefined();
          expect(id).toBeDefined();
          db.get(id, function(err, val) {
            expect(val).toEqual({a:1,_id:id});
            done();
          });
        });
      });
    });
  });
  
  describe("when you have a shumble db just for yourself", function() {
    var db = openDB('http://foo.com/shumble');
    it("it should be able to iterate over all the keys", function(done) {
      var all;
      
      db.ready(function() {
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
  });
  
  describe("when you have a shumble 2 db just for yourself", function() {
    var db = openDB('http://foo.com/shumble2');
    it("it should be able to nuke everything", function(done) {
      var all;
      
      db.ready(function() {
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
  });

  describe("when you have another db just for yourself where you have overriden request", function() {
    var db = openDB('http://foo.com/syncables');
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
        , callback = sinon.spy();
        
      db.ready(function() {
        db.put("a", {a:1}, function(err) {
          expect(err).toBeNullOrUndefined();
          db.put("b", {b:2}, function(err) {
            expect(err).toBeNullOrUndefined();
            db.put("c", {c:3}, function(err) {
              db.destroy("b", function(err) {
                expect(err).toBeNullOrUndefined();
                db.sync(callback);
                var i = 0;
                (function respond(done) {
                  (function schedule() {
                    if (requests.length > i) {
                      requests[i].respond(201, {}, '{}');
                      i += 1;
                      if (i >= 4) { done(); }
                      else { setTimeout(schedule, 100); }
                    } else {
                      setTimeout(schedule, 100);
                    }
                  }());
                }(function() {
                  expect(callback.calledWith()).toEqual(true);
                  db.unsynced_keys(function(err, unsyncked_keys) {
                    expect(err).toBeNullOrUndefined();
                    expect(unsyncked_keys.length).toEqual(0)
                    done();
                  });
                }));
              });
            });
          });
        });
      });
    });
  });
    
    describe("when you have yet another db just for yourself where you have overriden request", function() {
      var db = openDB('http://foo.com/syncables2');
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
          , callback;
    
        callback = function(err) {
          expect(err instanceof Error).toEqual(true);
          expect(err.message).toEqual('Conflict');
          expect(err.mine).toEqual({a:1,_id:'a'});
          expect(err.theirs).toEqual({a:2,_id:"a"});
          done();
        };

        db.ready(function() {
          db.put("a", {a:1}, function(err) {
            if (err) { throw err; }
            db.sync(callback);
            var responses = [
                [409, {}, '{}']
              , [200, {}, '{"a":2,"_id":"a"}']
            ];
            (function respond() {
              var i = 0;
              (function schedule() {
                var req;
                if (requests.length > i) {
                  req = requests[i];
                  req.respond.apply(req, responses[i]);
                  i += 1;
                  if (i >= responses.length) { return; }
                  setTimeout(schedule, 100);
                } else {
                  setTimeout(schedule, 100);
                }
              }());
            }());
          });
        });
      });
    });
    
    describe("when you have yet another second db just for yourself where you have overriden request", function() {
      var db = openDB('http://foo.com/syncables3');
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
          done({a:3});
        }
        
        db.ready(function() {
          db.put("a", {a:1}, function(err) {
            if (err) { throw err; }
            db.sync(resolveConflict, callback);

            (function respond(done) {
              var responses = {
                  0: [409, {}, '{}']
                , 1: [200, {'Content-Type': 'application/json'}, '2']
                , 2: [201, {}, '{}']
                , 3: [200, {'Content-Type': 'application/json'}, '{"results":[], "last_seq":0}']
              };
              var i = 0;
              (function schedule() {
                var req;
                if (requests.length > i) {
                  req = requests[i];
                  req.respond.apply(req, responses[i]);
                  i += 1;
                  if (i >= 4) {
                    return done();
                  }
                  setTimeout(schedule, 100);
                } else {
                  setTimeout(schedule, 100);
                }
              }());
            }(function() {
              setTimeout(function() {
                expect(resolveConflictCalled).toEqual(true);
                expect(callback.called).toEqual(true);
                expect(callback.callCount).toEqual(1);
                expect(callback.getCall(0).args.length).toEqual(0);
                db.get("a", function(err, val) {
                  expect(err).toBeNullOrUndefined();
                  expect(val).toEqual({a:3,_id:'a'});
                  done();
                });
              }, 200);
            }));
          });
        });
      });
    });
    
    describe("when you have yet another third db just for yourself where you have overriden request", function() {
      var db = openDB('http://foo.com/syncables4');
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
    
        db.ready(function() {
          db.sync(callback);

          (function respond(done) {
            var responses = {
                0: [200, {'Content-Type': 'application/json'}, '{"results":[{"_id":"a","doc":{"a":1}},{"id":"b","doc":{"a":2}}], "last_seq":2}']
            };
            var i = 0;
            (function schedule() {
              var req;
              if (requests.length > i) {
                req = requests[i];
                req.respond.apply(req, responses[i]);
                i += 1;
                if (i >= 1) {
                  return done();
                }
                setTimeout(schedule, 100);
              } else {
                setTimeout(schedule, 100);
              }
            }());
          }(function() {
            setTimeout(function() {
              expect(callback.called).toEqual(true);
              expect(callback.callCount).toEqual(1);
              expect(callback.getCall(0).args.length).toEqual(0);
              db.get("a", function(err, val) {
                expect(err).toBeNullOrUndefined();
                expect(val).toEqual({a:1, _id:'a'});
                db.get("b", function(err, val) {
                  expect(err).toBeNullOrUndefined();
                  expect(val).toEqual({a:2, _id:'b'});
                  done();
                });
              });
            }, 200);
          }));
        });
      });
    });
});