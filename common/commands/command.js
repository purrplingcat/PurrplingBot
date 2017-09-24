const LOGGER = require("../../lib/logger");
const CommandAuthority = require("./commandAuthority");

var logger = LOGGER.createLogger("CommandBase"); // Command Controler

class Command {
  constructor(commander) {
    if (!commander) throw new Error("Commander not given or is null!");
    this.constructor.LOGGER = logger = LOGGER.createLogger(this.constructor.name);
    this.commander = commander;
    this.core = commander.core;
    this.usage = "";
    this.description = "";
    this.guildChannelOnly = false;
    this.botAdminOnly = false;
    this.guildOwnerOnly = false;
    this.restrictions = null;
    this.tag = null;
    this._ = this.constructor;
  }

  exec(message, tail) {
    var authority = new CommandAuthority(this.core.Acl, message);
    if (!message.member && this.guildChannelOnly === true) {
      message.reply(`I'm sorry, command \`${prefix}${cmd}\` can't be executed in this channel!`)
      .then(logger.warn("This command is guild channel ONLY! Can't execute it in #%s", message.channel.name))
      .catch(logger.error);
      return;
    }
    if (!this._isExecPermitted(authority)) {
      message.reply("You are not permitted for execute this command!")
      .then(logger.warn("Permission denied for execute command!"))
      .catch(logger.error);
      return;
    }
    logger.log("Executing command ...");
    this.__exec(message, tail, authority);
  }

  /*
   * @protected
   * @magic
   */
  __exec(message, tail, authority = null) {
    throw new Error('You have to implement the method exec()!');
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
