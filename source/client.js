var net = require("net");
var types = require("./types");
var Connection = require("./connection").Connection;

// "tcp://127.0.0.1:46658" -> {host,port}
// "unix://path" -> {path}
function ParseAddr(addr) {
  
}

// TODO: Handle auto-reconnect & re-sending requests.
function Client(addr) {
  
}

Client.prototype._connect = function() {
  
}

Client.prototype.onResponse = function(resBytes, cb) {
  
}

Client.prototype.setError = function(error) {
  
}

Client.prototype.flush = function(cb) {
  
}

Client.prototype.info = function(cb) {
  
}

Client.prototype.setOption = function(key, value, cb) {
  
}

Client.prototype.deliverTx = function(txBytes, cb) {
  
}

Client.prototype.checkTx = function(txBytes, cb) {
  
}

Client.prototype.commit = function(cb) {
  
}

Client.prototype.query = function(data, path, height, prove, cb) {
  
}

Client.prototype.initChain = function(cb) {
  
}

Client.prototype.beginBlock = function(cb) {
  
}

Client.prototype.endBlock = function(cb) {
  
}

Client.prototype.queueRequest = function(type, reqObj, cb) {
  
}

Client.prototype.wakeSender = function() {
  
}

Client.prototype.sendRequest = function() {
  // Get next request to send
  var nextReqRes = this.reqResQ[this.reqResQSendPtr];
  if (!nextReqRes) {
    // NOTE: this case is duplicated at the end of this function
    this.sending = false;
    return // Nothing to send, we're done!
  }
  // Send request

  // If we have more messages to send...
  if (this.reqResQ.length > this.reqResQSendPtr) {
    
  } else {
    // NOTE: this case is duplicated at the start of this function
    return // Nothing to send, we're done!
  }
}

Client.prototype.close = function() {
  this.conn.close();
}

module.exports = {
  Client: Client,
  ParseAddr: ParseAddr,
};
