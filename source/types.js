function xport(exports, m) {
  for (var key in m) {
    exports[key] = m[key];
  }
}

var proto = require("protobufjs");
var protoPath = require("path").join(__dirname, "types.proto"); // TODO: better to just compile this into a js file.
var builder = proto.loadProtoFile(protoPath);
var types = builder.build("types");

var reqMethodLookup = {};
reqMethodLookup["info"]        = "info";
reqMethodLookup["set_option"]  = "set_option";
reqMethodLookup["deliver_tx"]  = "deliver_tx";
reqMethodLookup["check_tx"]    = "check_tx";
reqMethodLookup["commit"]      = "commit";
reqMethodLookup["query"]       = "query";
reqMethodLookup["init_chain"]  = "init_chain";
reqMethodLookup["begin_block"] = "begin_block";
reqMethodLookup["end_block"]   = "end_block";

var resMessageLookup = {};
resMessageLookup["info"]        = types.ResponseInfo;
resMessageLookup["set_option"]  = types.ResponseSetOption;
resMessageLookup["deliver_tx"]  = types.ResponseDeliverTx;
resMessageLookup["check_tx"]    = types.ResponseCheckTx;
resMessageLookup["commit"]      = types.ResponseCommit;
resMessageLookup["query"]       = types.ResponseQuery;
resMessageLookup["init_chain"]  = types.ResponseInitChain;
resMessageLookup["begin_block"] = types.ResponseBeginBlock;
resMessageLookup["end_block"]   = types.ResponseEndBlock;

module.exports = types;
module.exports.reqMethodLookup = reqMethodLookup;
module.exports.resMessageLookup = resMessageLookup;
