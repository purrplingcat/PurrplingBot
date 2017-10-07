const GroupCommand = require("./groupCommand");

class SimpleGroupCommand extends GroupCommand {
  constructor(commander) {
    super(commander);
  }

  setDescription(desc) {
    this.description = desc;
    return this;
  }

  setUsage(usage) {
    this.usage = usage;
    return this;
  }

  setExample(example) {
    this.example = example;
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

  setRestrictions(perms) {
    this.restrictions = perms;
    return this;
  }

  setTag(tag) {
    this.Tag = tag;
    return this;
  }
}

module.exports = SimpleGroupCommand;
