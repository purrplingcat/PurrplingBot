console.prefix = "";

var consoleStamp = require('console-stamp');

function initLogger(parrentLogger) {
  consoleStamp(parrentLogger, {
    pattern: 'dd.mm.yyyy HH:MM:ss.l',
    include: ["dir", "log", "info", "warn", "error", "fatal"],
    level: (process.env.DEBUG == 1) ? "log" : "info",
    metadata: function() {
      if (parrentLogger != null && parrentLogger.prefix.length) {
        return '<' + parrentLogger.prefix + '>';
      }
    }
  }); // Setup logger
}

exports.init = initLogger;
