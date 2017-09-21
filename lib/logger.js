const consoleStamp = require('console-stamp');

class Logger extends console.Console {
  constructor(prefix, stdout, stderr) {
    if (!stderr) stderr = stdout;
    super(stdout, stderr);
    this._prefix = prefix || "";
  }

  derive(prefix, out = process.stdout, errOut = process.stderr) {
    if (!prefix) throw new Error("Can't derive logger - No prefix defined!");
    return Logger.createLogger(this.Prefix + ":" + prefix, out, errOut);
  }

  get Prefix() {
    return this._prefix;
  }

  static createLogger(prefix, out = process.stdout, errOut = process.stderr) {
    var logger = new Logger(prefix, out, errOut);
    initLogger(logger); // Init new logger at derivation
    return logger;
  }

}

function initLogger(logger) {
  consoleStamp(logger, {
    pattern: 'dd.mm.yyyy HH:MM:ss.l',
    include: ["dir", "log", "info", "warn", "error", "fatal"],
    level: (process.env.DEBUG > 0) ? "log" : "info",
    metadata: function() {
      if (logger != null && logger.Prefix.length) {
        return '<' + logger.Prefix + '>';
      }
    }
  });
}

module.exports = Logger;
