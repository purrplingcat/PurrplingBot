const LOGGER = require("../../lib/logger");
const CommandAuthority = require("./commandAuthority");

var logger = LOGGER.createLogger("CommandBase"); // Command Controler

class Command {
  constructor(commander) {
    if (!commander) throw new Error("Commander not given or is null!");
    this.logger = this.constructor.LOGGER = logger = LOGGER.createLogger(this.constructor.name);
    this.commander = commander;
    this.core = commander.core;
    this.usage = "";
    this.description = "";
    this.example = "";
    this.guildChannelOnly = false;
    this.botAdminOnly = false;
    this.guildOwnerOnly = false;
    this.restrictions = null;
    this.tag = null;
    this.type = "exec_command";
    this._ = this.constructor;
  }

  exec(cmdMessage, authority) {
    if (!cmdMessage.member && this.guildChannelOnly === true) {
      cmdMessage.reply(`I'm sorry, command \`${cmdMessage.prefix}${cmd}\` can't be executed in this channel!`)
      .then(logger.warn("This command is guild channel ONLY! Can't execute it in #%s", cmdMessage.channel.name))
      .catch(logger.error);
      return;
    }
    if (!this._isExecPermitted(authority)) {
      cmdMessage.reply("You are not permitted for execute this command!")
      .then(logger.warn("Permission denied for execute command!"))
      .catch(logger.error);
      return;
    }
    logger.log("Executing command ...");
    this.__exec(cmdMessage, authority);
  }

  printHelp(cmd) {
    var prefix = this.commander.Prefix;
    var help_text = "Help for command: **" + prefix + cmd + "**" 
      + (this.botAdminOnly || this.guildOwnerOnly || this.restrictions ? " (RESTRICTED)" : "");
    if (this.description && this.description.length > 0) {
      help_text += "\n\n*" + this.description + "*";
    }
    if (this.usage && this.usage.length > 0) {
      let example = "";
      if (this.example && this.example.length > 0) {
        example = "\n\nExample:\n" + this.example.replace(/%cmd%/g, prefix + cmd);
      }
      help_text += "\n\n```\nUsage:\n" + prefix + cmd + " " + this.usage + example + "\n```";
    }
    return help_text;
  }

  /*
   * @protected
   * @magic
   */
  __exec(message, authority) {
    throw new Error('You have to implement the method __exec()!');
  }

  _isExecPermitted(authority) {
    if (this.botAdminOnly) return authority.BotAdmin;
    if (this.guildOwnerOnly) return authority.GuildOwner;
    if (!this.restrictions) return true;
    return authority.hasPermission(this.restrictions);
  }

  get Usage() {
    return this.usage;
  }

  get Description() {
    return this.description;
  }

  get Example() {
    return this.example;
  }

  get GuildChannelOnly() {
    return this.guildChannelOnly;
  }

  get Tag() {
    return this.tag;
  }

  set Tag(tag) {
    if (this.tag)
      throw new Error(`Can't set tag '${tag}' - Command already tagged as '${this.tag}'!`);
    this.tag = tag;
  }

  get Commander() {
    return this.commader;
  }
}

Command.logger = logger;
module.exports = Command;
