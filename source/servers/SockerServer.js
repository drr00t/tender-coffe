"use strict";

const
  net = require("net"),
  EventEmitter = require("events").EventEmitter,
  types = require("../types"),
  // connection = require("./connection").Connection,
  OriginalServer = require("../server"),
  wire = require("js-wire"),
  util = require('util'),

  maxWriteBufferLength = 4096;
;

  class Connection extends EventEmitter {
      
    constructor(app,conn) {
      super()
      this.recvBuf = Buffer.alloc(0);
      this.sendBuf = Buffer.alloc(0);
      this.waitingResult = false;
      this.app = app;
      this.conn = conn;

      // console.log('types: %j', types);
      console.log('request types: %j', types.reqMethodLookup);
      console.log('response types: %j', types.resMessageLookup);

      this.conn.on('data',(data)=>{
          this.receiveData(data);
      });

      this.conn.on('end', function() {
        console.log("connection ended.");
      });

      this.conn.on('error', function(err) {
        console.log("communication error: %s",err);
      });
    }

    receiveData(data){
      let self = this;
      let msgBytes;
      let bfData = Buffer.from(data);

      console.log('data received: %j', bfData);

      if (bfData.length > 0) {
        self.recvBuf = Buffer.concat([self.recvBuf, bfData]);
        // console.log('data received concat: %j', self.recvBuf.toString());
      }
      if (this.waitingResult) {
        return;
      }
      
      let rWire = undefined;
      try {

        rWire = new wire.Reader(self.recvBuf);
        msgBytes = rWire.readByteArray();
        
        console.log('wire decode: %j', msgBytes);

        self.recvBuf = rWire.buf.slice(rWire.offset);
        self.waitingResult = true;
        self.conn.pause();

        let req = types.Request.decode(msgBytes);

        console.log('message decoded: %j', req);

        let reqType = req.value;

        console.log('message type {%s} data: %j', reqType, req[reqType]);

        self.app.emit(reqType, self, req[reqType]);

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
      let buf = Buffer.from(1+msgLength+msgBytes.length);
      let w = new wire.Writer(buf);
      w.writeByteArray(msgBytes); // TODO technically should be writeVarint
      this.sendBuf = Buffer.concat([this.sendBuf, w.getBuffer()]);
      
      if (this.sendBuf.length >= maxWriteBufferLength) {
          console.log('byte limit achieved: ' +
            maxWriteBufferLength + ' user data: ' + this.sendBuf.length);
      }
      let n = this.conn.write(this.sendBuf);
      console.log('bytes transfered: ' + n);
      this.sendBuf = Buffer.alloc(0);
    }

    close(){
      this.conn.destroy();
    }
  }

  class Application extends EventEmitter{
    constructor(){
      super()

      this.on('check_tx',(conn, req)=>{
        console.log('data checkTx: %j', req);
        let resMessageType = types.resMessageLookup['check_tx'];
        let  res = new types.Response();
        let  resValue = new resMessageType({"resObj":"data"});
        res.set(msgType, resValue);
        conn.writeMessage(res);
      });

      this.on('deliver_tx',(conn, req)=>{
        console.log('data deliverTx: %j', req);
      });

      this.on('init_chain',(conn, req)=>{
        console.log('data initChain: %j', req);
      });

      this.on('begin_block',(conn, req)=>{
        console.log('data beginBlock: %j', req);
      });

      this.on('end_block',(conn, req)=>{
        console.log('data endBlock:  %j', req);
      });

      this.on('commit',(conn, req)=>{
        console.log('data commit:  %j', req);
      });

      this.on('query',(conn, req)=>{
        console.log('data query:  %j', req);
      });

      this.on('info',(conn, req)=>{
        console.log('data info:  %j', req);

        // string data = 1;
        // string version = 2;
        // uint64 last_block_height = 3;
        // bytes last_block_app_hash = 4;
  
        let res = new types.Response({
            echo: new types.ResponseInfo({
              data: "",
              version:"",
              last_block_height:0,
              last_block_app_hash:Buffer.alloc(40)
            })
        });
        conn.write(res);        
      });

      this.on('echo',(conn, req)=>{
        console.log('message echo req %j', req);
        let res = new types.Response({
            echo: new types.ResponseEcho({message: req.message})
        });

        conn.write(res);        
      });

      this.on('set_option',(conn, req)=>{
        console.log('data setOption:  %j', req);
        let res = new types.Response({
            echo: new types.ResponseSetOption({log:"OK"})
        });
      });

      this.on('flush',(conn, req)=>{
        console.log('data flush');
        let res = new types.Response({
          flush: new types.ResponseFlush(),
        });
        conn.write(res);
      });
    }
  }

  class Server{
    constructor(app){
      let self = this;
      self.app = app;
      self.server = net.createServer((conn)=>{
        conn.name = conn.remoteAddress + ":" + conn;
        console.log('new connection received: %j', conn.name);

        this.sock = new Connection(self.app, conn);
      });

      self.server.on('error',(error)=>{
        console.log("server failed: %j", error);
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
