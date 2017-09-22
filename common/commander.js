const LOGGER = require("../lib/logger");
const UTILS = require("../lib/utils");

var logger = LOGGER.createLogger("Commander");

class Commander {
  constructor(core, cmdPrefix) {
    this.core = core;
    this.cmdPrefix = cmdPrefix;
    this._commandsHandledCount = 0;
    this.aliases = {};
    this.cmds = {};
  }

  /**
  * @param message - Channel message driver
  */
  check_message_for_command(message) {
    var ex = message.content.split(" ");
    var prefix = this.cmdPrefix;
    var cmd = ex[0].toLowerCase();
    if (!cmd.startsWith(prefix)) {
      return;
    }

    //Block the bot to react own commands
    if (message.author.id === this.core.getDiscordClient().user.id) {
      return false;
    }

    cmd = cmd.substring(prefix.length);
    var tail = message.content.substring(cmd.length + prefix.length + 1);

    if (cmd in this.aliases) {
      var aliased = this.aliases[cmd];
      logger.info(`Called alias '${cmd}' for '${aliased}' on #${message.channel.name} by: ${message.author.username}`);
      var argv = aliased.split(' ');
      cmd = argv.shift();
      tail = tail + argv.join(' ');
      logger.log("Aliased cmd: %s Tail: %s", cmd, tail);
    }
    if (cmd == "help") {
      logger.info(`Printing requested help from user: ${message.author.username}\t Channel: #${message.channel.name}`);
      if (tail in this.aliases) {
        message.channel.send(`**${prefix}${tail}** is alias for **${prefix}${this.aliases[tail]}**`)
        .catch(logger.error);
        return true;
      }
      if (tail) {
        logger.info("Request help for command %s%s", prefix, tail);
        message.channel.send(UTILS.printCmdHelp(tail, this.cmds, prefix));
      }
      else {
        var _cmds = Object.keys(this.cmds).concat(Object.keys(this.aliases));
        message.channel.send(UTILS.printHelp(_cmds, prefix));
      }
      this._commandsHandledCount++;
      this.core.stats.commandsHandled = this._commandsHandledCount; // @deprecated use
      this.core.emit("commandHandled", cmd, tail, message);
      return true;
    }
    if (this.cmds.hasOwnProperty(cmd)) {
      try {
        logger.info(`Handle command: ${cmd} (${tail})\tUser: ${message.author.username}\t Channel: #${message.channel.name}`);
        this.cmds[cmd].exec(message, tail, this.core);
        this._commandsHandledCount++;
        this.core.stats.commandsHandled = this._commandsHandledCount; // @deprecated use
        this.core.emit("commandHandled", cmd, tail, message);
      } catch (err) {
        message.reply(`Failed to execute command: ${prefix}${cmd}`);
        logger.error("Command '%s%s' execution failed!", prefix, cmd);
        logger.error(err);
        logger.info("I am still running!");
      }
      return true;
    } else {
      if (prefix.length > 0) {
        message.channel.send(`Unknown command: ${prefix}${cmd}`)
        .then(logger.info(`Unknown command: ${cmd} \tUser: ${message.author.username}\t Channel: #${message.channel.name}`))
        .catch(logger.error);
      }
    }
    return false;
  }

  addCommand(cmdName, cmdObject) {
    try {
      this.cmds[cmdName] = cmdObject;
    } catch (err) {
      logger.error("Failed to add command: %s", cmdName);
      logger.error(err);
    }
  }

  get Commands() {
    return this.cmds;
  }

  get Prefix() {
    return this.cmdPrefix;
  }

  addAlias(aliasName, commandString) {
    try {
      aliases[aliasName] = commandString;
    } catch (err) {
      logger.error("Failed to add alias: %s to: %s", aliasName, commandString);
      logger.error(err);
    }
  }

  static get Logger() {
    console.log("got logger");
    return logger;
  }
}

module.exports = Commander;
