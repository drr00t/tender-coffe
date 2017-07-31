var wire = require("js-wire");

var maxWriteBufferLength = 4096; // Any more and flush

function Connection(socket, msgCb) {
  this.socket = socket;
  this.recvBuf = new Buffer(0);
  this.sendBuf = new Buffer(0);
  this.msgCb = msgCb;
  this.waitingResult = false;
  var conn = this;

  // Handle ABCI requests.
  socket.on('data', function(data) {
    conn.appendData(data);
  });
  socket.on('end', function() {
    console.log("connection ended");
  });
}

Connection.prototype.appendData = function(bytes) {
  
};

Connection.prototype.writeMessage = function(msg) {
  
};

Connection.prototype.flush = function() {
  
}

Connection.prototype.close = function() {
  this.socket.destroy();
}

module.exports = {
  Connection: Connection
};
