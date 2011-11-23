}
// =============================================================== exports ~==

dribbledb.version = '@VERSION';
if ('function' === typeof(define) && define.amd) {
  define('dribbledb', function() {
    return dribbledb;
  });
} 
else {
  root.dribbledb = dribbledb;
}