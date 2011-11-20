* separate url building and other modules inside dribbledb.js
* sync when there is a destroy on the other side
* put(object) -> put(uuid(), object) if no ._id in object
* put(object) -> put(object._id, object) if ._id in object
* put returns id
* auto sync
* Sort out the CORS / JSONP stuff
* Sync callbacks
* Synchronization
* Check 500 errors when socket goes away - proxy related?
* db.all()
* versioning?
* db.nuke() -> destroy all docs
* pagination
* filtering
* views (?)