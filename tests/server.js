var express    = require('express')
  , app        = express.createServer();


app.configure( function () {
  app.use(express.logger({ format: 
    '{"date": ":date", "status": ":status", "method": ":method", ' +
    '"url": ":url", "time": ":response-time", "agent": ":user-agent", ' +
    '"http": ":http-version",  "referer": ":referrer"}' }));

  app.use(express.static(__dirname + '/..'));
  app.use(express.errorHandler({dumpExceptions: true}));
});

app.listen(8001);