const
  net = require("net"),
  types = require("./types"),
  connection = require("./connection").Connection,
  OriginalServer = require("./server");

  class Connection{
    constructor(app,conn){
      let self = this;
      
      self.app = app;
      self.conn = conn;

      self.conn.on('data',(data)=>{
          console.log('data received: {0}', data);

          let req = types.Request.decode(data);
          let reqType = req.value;

          self.app.emit(reqType,req.value.message);
      });
    }
  }

  class Application{
    constructor(){
      
    }

    checkTx(req){}
    deliverTx(req){}
    initChain(req){}
    beginBlock(req){}
    endBlock(req){}
    commit(req){}
    query(req){}
    info(req){}
    echo(req){}
    setOption(req){}
    flush(req){}
  }

  class Server{
    constructor(app){
      let self = this;
      self.app = app;
      self.server = net.createServer((conn)=>{
        conn.name = socket.remoteAddress + ":" + socket;
        console.log('new connection received: {0}', conn.name);

        let conn = new Connection(self.app, conn);
      });

      self.server.on('error',(error)=>{
        console.log("server failed: {0}", error);
      });

    }

  }



module.exports = {
  abci: '',
};
