const LOGGER = require("../lib/logger");
const FS = require('fs');
const PATH = require('path');

var logger = LOGGER.createLogger("Builtin");

class BuiltinCommands {

  static registerBuiltinCommands(commander, commandsDir) {
    logger.log("Builtin commands folder: %s", commandsDir);
    let cmdlist = [];
    FS.readdirSync(commandsDir).forEach(cmdFile => {
      let cmdName = PATH.parse(cmdFile).name;
      logger.log("Regiter builtin command: %s%s from: %s", commander.Prefix, cmdName, cmdFile);
      commander.addCommand(cmdName, require(commandsDir + cmdFile));
      cmdlist.push(commander.Prefix + cmdName);
    });
    logger.info("Builtin commands registered: %s", cmdlist.join(', '));
  }
}

module.exports = BuiltinCommands;
module.exports.logger = logger;
