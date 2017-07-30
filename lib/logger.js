console.prefix = "";

var consoleStamp = require('console-stamp');

function initLogger(parrentLogger) {
  consoleStamp(parrentLogger, {
    pattern: 'dd.mm.yyyy HH:MM:ss.l',
    metadata: function() {
      if (parrentLogger != null && parrentLogger.prefix.length) {
        return '<' + parrentLogger.prefix + '>';
      }
    }
  }); // Setup logger
}

exports.init = initLogger;
