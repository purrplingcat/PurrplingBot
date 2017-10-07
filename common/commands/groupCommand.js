const Command = require("./command");
const CommandArgv = require("./commandArgv");
const SimpleCommand = require("./simpleCommand");
const Discord = require('discord.js');
const DELIMITER = ":";

class GroupCommand extends Command {
  constructor(commander) {
    super(commander);
    this.type = "group_command"
    this.cmds = new Discord.Collection();
  }

  __exec(cmdMessage, authority) {
    let prefix = this.commander.Prefix;
    let cmd = cmdMessage.command;
    let [ subCmd ] = cmdMessage.args;

    if (!subCmd || subCmd == "help") {
        let shArgv = cmdMessage.toArgv().shift();
        cmdMessage.channel.send(this.printHelp(cmd + " " + shArgv.argsString))
        .then(this.logger.info("Group help listing printed!"))
        .catch(this.logger.error);
        return;
    }
    let cmdObject = this.cmds[subCmd];
    if (!cmdObject) {
      cmdMessage.reply(`Unknown command \`${prefix}${cmd} ${subCmd}\``)
      .then(this.logger.info(`Unknown subcommand \`${prefix}${cmd} ${subCmd}\``))
      .catch(this.logger.error);
      return;
    }
    if (typeof cmdObject.exec !== "function") {
      this.logger.error("Subcommand %s has'nt valid exec() method!");
      cmdMessage.reply(`An error occured while executing subcommand \`${argv.toString(true)}\``);
    }
    cmdObject.exec(cmdMessage.shift(), authority);
  }

  addSubcommand(cmdName, cmdObject) {
    try {
      this.cmds[cmdName] = cmdObject;
      this.logger.log("Subcommand added: %s%s", this.commander.Prefix, cmdName);
      return cmdObject;
    } catch (err) {
      this.logger.error("Failed to add subcommand: %s", cmdName);
      this.logger.error(err);
      return null;
    }
  }

  createSubcommand(cmdName, callback) {
    return this.addSubcommand(cmdName, new SimpleCommand(callback, this.commander));
  }

  printHelp(cmdPhrase) {
    var prefix = this.commander.Prefix;
    var [ cmd, subCmd ] = new CommandArgv(cmdPhrase, prefix).toArray();
    var help_text = "";
    if (subCmd) {
      if (!this.cmds.hasOwnProperty(subCmd)) {
        return "Unknown subcommand: " + prefix + cmdPhrase + ". Type " + prefix + "help "+ cmd + " to list availaible subcommands.";
      }
      help_text = this.cmds[subCmd].printHelp(cmdPhrase);
    } else {
      help_text = super.printHelp(cmd);
      help_text += "\n\nAvailaible subcomands: \n```";
      for (var subCmdName in this.cmds) {
        let subCmd = this.cmds[subCmdName];
        help_text += `${prefix}${cmd} ${subCmdName}${subCmd.Usage ? " "+ subCmd.Usage : ""} - ${subCmd.Description}\n`;
      }
      help_text += "\n```";
    }
    return help_text;
  }

  get Subcommands() {
    return this.cmds;
  }
}

GroupCommand.DELIMITER = DELIMITER;
module.exports = GroupCommand;
