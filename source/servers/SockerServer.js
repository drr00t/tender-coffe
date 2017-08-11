"use strict";

const
  net = require("net"),
  EventEmitter = require("events").EventEmitter,
  types = require("../types"),
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

      // console.log('data received: %j', bfData);

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
        
        // console.log('wire decode: %j', msgBytes);

        self.recvBuf = rWire.buf.slice(rWire.offset);
        self.waitingResult = true;
        self.conn.pause();

        let req = types.Request.decode(msgBytes);

        // console.log('message decoded: %j', req);

        let reqType = req.value;

        // console.log('message type {%s} data: %j', reqType, req[reqType]);

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
      // console.log("writing msg: %j", msg);

      let msgBytes = msg.encode().toBuffer();
      let msgLength = wire.uvarintSize(msgBytes.length);
      let buf = Buffer.alloc(1+msgLength+msgBytes.length);
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

        // CodeType          code        = 1;
        // bytes             data        = 2;
        // string log = 3;

        let resMessageType = types.resMessageLookup['check_tx'];
        let  res = new types.Response({
          check_tx: new types.ResponseCheckTx({
            code: types.CodeType.OK,
            data: req.tx,
            log:"OK"
          })
        });
        conn.write(res);
      });

      this.on('deliver_tx',(conn, req)=>{
        console.log('data deliverTx: %j', req);
        let  res = new types.Response({
          deliver_tx: new types.ResponseDeliverTx({
            code: types.CodeType.OK,
            data: req.tx,
            log:"OK"
          })
        });
        conn.write(res);
      });

      this.on('init_chain',(conn, req)=>{
        console.log('data initChain: %j', req);
      });

      this.on('begin_block',(conn, req)=>{
        console.log('data beginBlock: %j', req);
      });

      this.on('end_block',(conn, req)=>{
        console.log('data endBlock:  %j', req);
        
        // let res = new types.Response({
        //     end_block: new types.ResponseEndBlock({
        //       diffs: 
        //     })
        // });

        // conn.write(res);
      });

      this.on('commit',(conn, req)=>{
        console.log('data commit:  %j', req);
        // CodeType          code        = 1;
        // bytes             data        = 2;
        // string log = 3;

        let res = new types.Response({
            commit: new types.ResponseCommit({
              code: types.CodeType.OK,
              data:Buffer.from("data"),
              log:"data saved"
            })
        });

        conn.write(res);
      });

      this.on('query',(conn, req)=>{
        console.log('data query:  %j', req);
      // CodeType          code        = 1;
      // int64             index       = 2;
      // bytes             key         = 3;
      // bytes             value       = 4;
      // bytes             proof       = 5;
      // uint64            height = 6;
      // string log = 7;
        let res = new types.Response({
            query: new types.ResponseQuery({
              code:types.CodeType.OK,
              index:10,
              key:Buffer.from("my_key"),
              value:Buffer.from("my_data"),
              proof:Buffer.alloc(0),
              height:1,
              log:"OK"
            })
        });

        conn.write(res);
      });

      this.on('info',(conn, req)=>{
        console.log('data info:  %j', req);

        // string data = 1;
        // string version = 2;
        // uint64 last_block_height = 3;
        // bytes last_block_app_hash = 4;
  
        let res = new types.Response({
            info: new types.ResponseInfo({
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
            set_option: new types.ResponseSetOption({log:"OK"})
        });
        conn.write(res);
      });

      this.on('flush',(conn, req)=>{
        console.log('data flush');
        let res = new types.Response({
          flush: new types.ResponseFlush()
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
