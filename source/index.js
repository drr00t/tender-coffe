function xport(exports, m) {
  for (var key in m) {
    exports[key] = m[key];
  }
}

module.exports = {};
xport(module.exports, require('./types'));
xport(module.exports, require('./servers/dougServer'));
xport(module.exports, require('./client'));
