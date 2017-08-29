console.prefix = "";

var consoleStamp = require('console-stamp');

function initLogger(parrentLogger) {
  consoleStamp(parrentLogger, {
    pattern: 'dd.mm.yyyy HH:MM:ss.l',
    include: ["dir", "log", "info", "warn", "error", "fatal"],
    level: (process.env.DEBUG > 0) ? "log" : "info",
    metadata: function() {
      if (parrentLogger != null && parrentLogger.prefix.length) {
        return '<' + parrentLogger.prefix + '>';
      }
    }
  }); // Setup logger
}

function createLogger(prefix, out = process.stdout, errOut = process.stderr) {
  var _logger = new console.Console(out, errOut);
  _logger.prefix = prefix;
  initLogger(_logger); // Init new logger at derivation
  return _logger;
}

exports.init = initLogger;
exports.createLogger = createLogger;
