require.paths.unshift('./vendor');
var sys = require("sys")
  , fs = require("fs")
  , path = require("path")
  , http = require("http")
  , repl = require("repl")
  , ws = require('websocket-server/lib/ws')
  , meryl = require('meryl/lib/meryl');
  _ = require('underscore/underscore')._;

function log(msg) {
  sys.puts(msg);
}


/*-----------------------------------------------
  Spin up our web server:
-----------------------------------------------*/

function readFile(path) {
  return fs.readFileSync(__dirname + path.replace(/^\.*/, ''), 'utf-8');
}

var static = function(path) {
  return readFile('/public/' + path);
};

var render = function(viewname, data) {
  var viewCnt = readFile('/view/' + viewname + '.html');
  return _.template(viewCnt, data);
};

meryl.h('GET /<filepath>', function () {
  return static(this.filepath);
});

meryl.h('GET /', function() {
  return static('index.html');
});

var httpServer = http.createServer(meryl.cgi);

/*-----------------------------------------------
  Spin up our websocket server:
-----------------------------------------------*/
var server = ws.createServer({ debug: true, server: httpServer });

server.addListener("listening", function(){
  log("Listening for connections.");
});

var aRepl;
var PROMPT = ">";

// Handle WebSocket Requests
server.addListener("connection", function(conn){
  log("opened connection: "+conn.id);

  aRepl = repl.start(PROMPT, conn);

  server.send(conn.id, "Connected as: "+conn.id);
  conn.broadcast("<"+conn.id+"> connected");

  conn.addListener("message", function(response){
    log("<"+conn.id+"> "+ response);
    aRepl.rli.write(response);
  });

});

server.addListener("close", function(conn){
  log("closed connection: "+conn.id);
  conn.broadcast("<"+conn.id+"> disconnected");
});

server.listen(8000);
