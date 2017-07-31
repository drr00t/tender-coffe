var abci = require("js-abci");
var util = require("util");

function CounterApp(){
	this.hashCount = 0;
	this.txCount = 0;
  this.serial = true;
};

CounterApp.prototype.info = function(req, cb) {
  return cb({
    data: util.format("hashes:%d, txs:%d", this.hashCount, this.txCount),
  });

}

CounterApp.prototype.setOption = function(req, cb) {
  
}

CounterApp.prototype.deliverTx = function(req, cb) {
  
}

CounterApp.prototype.checkTx = function(req, cb) {
  
}

CounterApp.prototype.commit = function(req, cb) {
	
}

CounterApp.prototype.query = function(req, cb) {
  return cb({code:abci.CodeType_OK, log:"Query not yet supported"});
}


var app = new CounterApp();
var appServer = new abci.Server(app);
appServer.server.listen(46658);
