const Command = require("./command");
const Discord = require('discord.js');
const DELIMITER = ":";

class GroupCommand() {
  constructor(commander) {
    super(commander);
    this.subcomands = new Discord.Collection();
    this.type = "group_command"
  }

  __exec(message, tail, authority) {
    let [ cmdPhrase ] = message.content.split(' ');
    let [ cmd, subcmd ] = cmdPhrase.split(DELIMITER);
    let prefix = this.commander.Prefix;
    let cmdObject = this.subcomands[subcmd];

    if (!subcmd) {
      if (typeof this.__default === "function") {
        this.__default(message, tail, authority);
      }
      else {
        this.printHelp(cmd);
      }
      return;
    }
    if (!cmdObject) {
      message.reply(`Unknown subcommand \`${prefix}${cmdPhrase}\``)
      .then(GroupCommand.LOGGER.info(`Unknown subcommand \`${prefix}${cmdPhrase}\``))
      .catch(GroupCommand.LOGGER.error);
      return;
    }
    if (typeof cmdObject.exec !== "function") {
      GroupCommand.LOGGER.error("Subcommand %s has'nt valid exec() method!");
      message.reply(`An error occured while executing subcommand \`${prefix}${cmdPhrase}\``);
    }
    cmdObject.exec(message, tail);
  }

  addSubcommand(cmdName, cmdObject) {
    try {
      this.cmds[cmdName] = cmdObject;
      logger.log("Subcommand added: %s%s", this.commander.Prefix, cmdName);
    } catch (err) {
      logger.error("Failed to add subcommand: %s", cmdName);
      logger.error(err);
    }
  }

  printHelp(cmdPhrase) {
    var [ cmd, subcmd ] = cmdPhrase.split(DELIMITER);
    var prefix = this.commander.prefix;
    var help_text = "";
    if (subCmd) {
      if (!cmds.hasOwnProperty(cmd)) {
        return "Unknown subcommand: " + prefix + cmdPhrase + ". Type " + prefix + "help "+ cmd + " to list availaible subcommands.";
      }
      help_text = "Subcommand: " + prefix + cmd;
      var cmd_context = this.subcommands[subcmd];
      if (cmd_context.description && cmd_context.description.length > 0) {
        help_text += "\nDescription: " + this.description;
      }
      if (cmd_context.usage && cmd_context.usage.length > 0) {
        help_text += "\n```\n" + prefix + cmd + " " + cmd_context.usage + "\n```";
      }
    } else {
      help_text = super.printHelp(cmd);
      help_text += "\n\nAvailaible subcomands: \n\n"
      for (var subCmdName in this.subcomands) {
        let subCmd = this.subcommand[subCmdName];
        help_text += `\`${prefix}${subCmdName} ${subCmd.Usage}\` - ${subCmd.Description}\n`;
      }
    }
    return help_text;
  }

  get Subcommands() {
    return this.subcomands;
  }
}

}

GroupCommand.DELIMITER = DELIMITER;
module.exports = GroupCommand;
