"use strict";

const
  net = require("net"),
  EventEmitter = require("events").EventEmitter,
  types = require("../types"),
  // connection = require("./connection").Connection,
  OriginalServer = require("../server"),
  wire = require("js-wire"),

  maxWriteBufferLength = 4096;
;

  class Connection extends EventEmitter {
      
    constructor(app,conn) {
      super()
      this.recvBuf = new Buffer(0);
      this.sendBuf = new Buffer(0);
      this.waitingResult = false;
      this.app = app;
      this.conn = conn;

      this.conn.on('data',(data)=>{
          console.log('data received: {0}', data);

          this.receiveData(data);

      });

      this.conn.on('end', function() {
          console.log("connection ended.");
      });
    }

    receiveData(data){
      let self = this;
      let msgBytes;
      if (data.length > 0) {
        self.recvBuf = Buffer.concat([self.recvBuf, new Buffer(data)]);
      }
      if (this.waitingResult) {
        return;
      }
      
      let rWire = undefined;
      try {

        rWire = new wire.Reader(self.recvBuf);
        msgBytes = rWire.readByteArray();

        self.recvBuf = rWire.buf.slice(rWire.offset);
        self.waitingResult = true;
        self.conn.pause();

        let req = types.Request.decode(data);
        let reqType = req.value;

        self.app.emit(reqType, self,!req.value?req.value: req.value.message);

        self.waitingResult = false;
        self.conn.resume();
        if (self.recvBuf.length > 0) {
          self.receiveData("");
        }

      } catch(e) {
        console.log('wire decode failed: ' + e);

        if (e.stack) {
          console.log("FATAL ERROR STACK: ", e.stack);
        }
        console.log("FATAL ERROR: ", e);

        return;
      }
    }

    write(msg){
      let msgBytes = msg.encode().toBuffer();
      let msgLength = wire.uvarintSize(msgBytes.length);
      let buf = new Buffer(1+msgLength+msgBytes.length);
      let w = new wire.Writer(buf);
      w.writeByteArray(msgBytes); // TODO technically should be writeVarint
      this.sendBuf = Buffer.concat([this.sendBuf, w.getBuffer()]);
      
      if (this.sendBuf.length >= maxWriteBufferLength) {
          console.log('byte limit achieved: ' +
            maxWriteBufferLength + ' user data: ' + this.sendBuf.length);
      }
      let n = this.conn.write(this.sendBuf);
      console.log('bytes tranfered: ' + n);
      this.sendBuf = new Buffer(0);
    }

    close(){
      this.conn.destroy();
    }
  }

  class Application extends EventEmitter{
    constructor(){
      super()

      this.on('checkTx',(conn, req)=>{
        console.log('data checkTx: {0}', req);
        let resMessageType = types.resMessageLookup['checkTx'];
        let  res = new types.Response();
        let  resValue = new resMessageType(resObj);
        res.set(msgType, resValue);
        conn.writeMessage(res);
      });

      this.on('deliverTx',(conn, req)=>{
        console.log('data deliverTx: {0}', req);
      });

      this.on('initChain',(conn, req)=>{
        console.log('data initChain: {0}', req);
      });

      this.on('beginBlock',(conn, req)=>{
        console.log('data beginBlock: {0}', req);
      });

      this.on('endBlock',(conn, req)=>{
        console.log('data endBlock: {0}', req);
      });

      this.on('commit',(conn, req)=>{
        console.log('data commit: {0}', req);
      });

      this.on('query',(conn, req)=>{
        console.log('data query: {0}', req);
      });

      this.on('info',(conn, req)=>{
        console.log('data info: {0}', req);
      });

      this.on('echo',(conn, req)=>{
        console.log('data echo: {0}', req);
        var res = new types.Response({
            echo: new types.ResponseEcho({message: req.echo.message})
        });

        conn.write(res);        
      });

      this.on('setOption',(conn, req)=>{
        console.log('data setOption: {0}', req);
      });

      this.on('flush',(conn, req)=>{
        console.log('data flush: {0}', req);
        var res = new types.Response({
          flush: new types.ResponseFlush(),
        });

        conn.write(res);
        conn.flush();
      });
    }
  }

  class Server{
    constructor(app){
      let self = this;
      self.app = app;
      self.server = net.createServer((conn)=>{
        conn.name = conn.remoteAddress + ":" + conn;
        console.log('new connection received: {0}', conn.name);

        this.sock = new Connection(self.app, conn);
      });

      self.server.on('error',(error)=>{
        console.log("server failed: {0}", error);
      });
    }

    start()
    {
      this.server.listen(46658)
    }
  }

new Server(new Application()).start();

// module.exports = {
//   abci: '',
// };
