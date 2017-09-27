const Command = require("./command");

class SimpleCommand extends Command {
  constructor(callback, commander) {
    if (!typeof callback !== "function")
      throw new Error("Invalid or none callback given!");
    super(commander);
    this.callback = callback;
  }

  __exec(message, tail, authority) {
    if (!typeof this.callback !== "function")
      throw new Error("Invalid or none callback for execute command!");
    this.callback(message, tail, authority);
  }

  setDescription(desc) {
    this.description = desc;
    return this;
  }

  setUsage(usage) {
    this.usage = usage;
    return this;
  }

  setGuildChannelOnly(val = true) {
    this.guildChannelOnly = val;
    return this;
  }

  setBotAdminOnly(val = true) {
    this.botAdminOnly = val;
    return this;
  }

  setGuildChannelOnly(val = true) {
    this.guildOwnerOnly = val;
    return this;
  }

  setRestrictions(perms) {
    this.restrictions = perms;
    return this;
  }

  setTag(tag) {
    if (this.tag)
      throw new Error(`Can't set tag '${tag}' - Command already tagged as '${this.tag}'!`);
    this.tag = tag;
    return this;
  }
}
