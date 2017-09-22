const LOGGER = require("../lib/logger");
const FS = require('fs');
const PATH = require('path');
const CMD_DIR = process.cwd() + "/common/Commands/";

var logger = LOGGER.createLogger("Builtin");

class BuiltinCommands {
  constructor(commander) {
    this._commander = commander;
    this.core = commander.core;
    this._registerBuiltinCommands(commander);
  }

  _registerBuiltinCommands(commander) {
    logger.log("Builtin commands folder: %s", CMD_DIR);
    FS.readdirSync(CMD_DIR).forEach(cmdFile => {
      let cmdName = PATH.parse(cmdFile).name;
      logger.log("Regiter builtin command: %s%s from: %s", this._commander.Prefix, cmdName, cmdFile);
      commander.addCommand(cmdName, require(CMD_DIR + cmdFile));
    });
  }

  get Core() {
    return core;
  }
}

module.exports = BuiltinCommands;
module.exports.logger = logger;
