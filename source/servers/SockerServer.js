const
  net = require("net"),
  wire = require("js-wire"),
  EventEmitter = require("events").EventEmitter,
  types = require("../types"),
  // connection = require("./connection").Connection,
  OriginalServer = require("../server"),
  wire = require("js-wire"),

  maxWriteBufferLength = 4096;
;

  class Connection extends EventEmitter {
    constructor(app,conn) {
      let self = this;
      self.recvBuf = new Buffer(0);
      self.sendBuf = new Buffer(0);
      self.waitingResult = false;
      self.app = app;
      self.conn = conn;

      self.conn.on('data',(data)=>{
          console.log('data received: {0}', data);

          let req = types.Request.decode(data);
          let reqType = req.value;

          self.app.emit(reqType,req.value.message);
      });

      self.conn.on('end', function() {
          console.log("connection ended.");
      });
    }

    write(msg){
      let msgBytes = msg.encode().toBuffer();
      let msgLength = wire.uvarintSize(msgBytes.length);
      let buf = new Buffer(1+msgLength+msgBytes.length);
      let w = new wire.Writer(buf);
      w.writeByteArray(msgBytes); // TODO technically should be writeVarint
      this.sendBuf = Buffer.concat([this.sendBuf, w.getBuffer()]);
      
      if (this.sendBuf.length >= maxWriteBufferLength) {
          console.log('byte limite achieved: ' 
          + maxWriteBufferLength + ' user data: ' + this.sendBuf.length);
      }
      let n = this.conn.write(this.sendBuf);
      console.log('bytes tranfered: : ' + n);
      this.sendBuf = new Buffer(0);
    }

    close(){
      this.conn.destroy();
    }
  }

  class Application extends EventEmitter{
    constructor(conn){
      this.conn = conn;
    }

    //mempool 
    checkTx(req){
      console.log('data checkTx: {0}', req);
        let resMessageType = types.resMessageLookup['checkTx'];
        let  res = new types.Response();
        let  resValue = new resMessageType(resObj);
        res.set(msgType, resValue);
        this.conn.writeMessage(res);
    }

    //consensus
    deliverTx(req){
      console.log('data deliverTx: {0}', req);

    }
    initChain(req){
      console.log('data initChain: {0}', req);

    }
    beginBlock(req){
      console.log('data beginBlock: {0}', req);

    }
    endBlock(req){
      console.log('data endBlock: {0}', req);

    }
    commit(req){
      console.log('data commit: {0}', req);

    }

    //query
    query(req){
      console.log('data query: {0}', req);

    }
    info(req){
      console.log('data info: {0}', req);
    }

    echo(req){
      console.log('data echo: {0}', req);
      var res = new types.Response({
          echo: new types.ResponseEcho({message: req.echo.message})
      });

      this.conn.write(res);
    }

    setOption(req){
      console.log('data setOption: {0}', req);
    }

    flush(req){
      console.log('data flush: {0}', req);
      var res = new types.Response({
        flush: new types.ResponseFlush(),
      });

      this.conn.writeMessage(res);
      this.conn.flush();
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

new Server().start();

// module.exports = {
//   abci: '',
// };
