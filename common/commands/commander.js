const LOGGER = require("../../lib/logger");
const UTILS = require("../../lib/utils");
const CommandMessage = require("./commandMessage");
const Discord = require('discord.js');

var logger = LOGGER.createLogger("Commander");

class Commander {
  constructor(core, cmdPrefix) {
    this.core = core;
    this.cmdPrefix = cmdPrefix;
    this._commandsHandledCount = 0;
    this.aliases = {};
    this.cmds = new Discord.Collection();
  }

  /**
  * @param message - Channel message driver
  */
  check_message_for_command(message) {
    var prefix = this.cmdPrefix;
    if (message.author.id === this.core.getDiscordClient().user.id) {
      return false; //Block the bot to react own potentially commands
    }
    if (!message.content.startsWith(prefix)) {
      return false; // Skip command handling if message is not a command
    }

    var cmdMessage = new CommandMessage(message.content, message, prefix);
    var cmd = cmdMessage.command;
    var tail = cmdMessage.argsString;

    if (cmd in this.aliases) {
      var aliased = this.aliases[cmd];
      logger.info(`Called alias '${cmd}' for '${aliased}' on #${message.channel.name} by: ${message.author.username}`);
      cmdMessage = new CommandMessage(aliased + '' + tail, message, prefix);
      cmd = cmdMessage.command;
      tail = cmdMessage.argsString;
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
        let cmd = this.cmds[tail];
        let help_text = "";
        if (!cmd) {
          help_text = "Unknown command: `" + prefix + tail + "`. Type `" + prefix + "help` to list availaible commands.";
        } else {
          if (typeof cmd.printHelp === "function") help_text = cmd.printHelp(tail);
          else help_text = UTILS.printCmdHelp(tail, this.cmds, prefix);
        }
        message.channel.send(help_text);
      }
      else {
        var _cmds = Object.keys(this.cmds).concat(Object.keys(this.aliases)).sort();
        message.channel.send(UTILS.printHelp(_cmds, prefix));
      }
      this._commandsHandledCount++;
      this.core.stats.commandsHandled = this._commandsHandledCount; // @deprecated use
      this.core.emit("commandHandled", cmd, tail, message);
      return true;
    }
    if (this.cmds.hasOwnProperty(cmd)) {
      try {
        if (!message.member && this.cmds[cmd].guildChannelOnly === true) {
          message.reply(`I'm sorry, command \`${prefix}${cmd}\` can't be executed in this channel!`)
          .then(logger.warn("Command %s%s is guild channel ONLY! Can't execute it in #%s", prefix, cmd, message.channel.name))
          .catch(logger.error);
          return true;
        }
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
      logger.log("Command added: %s%s", this.cmdPrefix, cmdName);
      return cmdObject;
    } catch (err) {
      logger.error("Failed to add command: %s", cmdName);
      logger.error(err);
      return null;
    }
  }

  get Commands() {
    return this.cmds;
  }

  get Aliases() {
    return this.aliases;
  }

  get Prefix() {
    return this.cmdPrefix;
  }

  addAlias(aliasName, commandString) {
    try {
      this.aliases[aliasName] = commandString;
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

Commander.logger = logger;
module.exports = Commander;
