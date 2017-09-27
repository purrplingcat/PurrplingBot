const CommandArgv = require("./commandArgv");
const Discord = require('discord.js');

class CommandMessage extends CommandArgv {
  constructor(cmdLine, discordMessage, prefix = "!") {
    if (!(discordMessage instanceof Discord.Message)) {
      throw new ReferenceError("The source message is not type of Discord.js Message!");
    }
    super(cmdLine, prefix);
    this._discordMessage = discordMessage;
    this._handledAt = new Date();
    this._id = Discord.Snowflake.generate();
  }

  reply(content, options) {
    return this._discordMessage.reply(content, options);
  }

  shift() {
    return new CommandMessage(this.argsString, this._discordMessage, this._prefix);
  }

  toArgv() {
    return new CommandArgv(this.toString(), this.prefix);
  }

  get discordMessage() {
    return this._discordMessage;
  }

  get channel() {
    return this._discordMessage.channel;
  }

  get caller() {
    return this._discordMessage.author;
  }

  get member() {
    return this._discordMessage.member;
  }

  get handledAt() {
    return this._handledAt;
  }

  get id() {
    return this._id;
  }
}

module.exports = CommandMessage;
