var net = require("net");
var types = require("./types");
var Connection = require("./connection").Connection;
var DougReceiver = require("./dougsanSource/dougServer");

// Takes an application and handles ABCI connection
// which invoke methods on the app
function Server(app) {
  // set the app for the socket handler
  this.app = app;

  // create a server by providing callback for 
  // accepting new connection and callbacks for 
  // connection events ('data', 'end', etc.)
  this.createServer();
}

Server.prototype.createServer = function(){
 //se conecta
}

// Wrap a function to only be called once.
var respondOnce = function(f) {
  
};

module.exports = {
  Server: Server,
};
