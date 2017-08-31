var consoleStamp = require('console-stamp');
console.prefix = "";

function initLogger(logger) {
  consoleStamp(logger, {
    pattern: 'dd.mm.yyyy HH:MM:ss.l',
    include: ["dir", "log", "info", "warn", "error", "fatal"],
    level: (process.env.DEBUG > 0) ? "log" : "info",
    metadata: function() {
      if (logger != null && logger.prefix.length) {
        return '<' + logger.prefix + '>';
      }
    }
  });
}

function createLogger(prefix, out = process.stdout, errOut = process.stderr) {
  var logger = new console.Console(out, errOut);
  logger.prefix = prefix || "";
  initLogger(logger); // Init new logger at derivation
  return logger;
}

exports.createLogger = createLogger;
