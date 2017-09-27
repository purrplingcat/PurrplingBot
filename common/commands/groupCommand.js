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

  __exec(message, tail, authority) {
    let prefix = this.commander.Prefix;
    let argv = new CommandArgv(message.content, prefix);
    let [ cmd, subCmd ] = argv.toArray();

    if (!subCmd || subCmd == "help") {
        let sh = argv.shift();
        message.channel.send(this.printHelp(cmd + " " + sh.argsString))
        .then(this.logger.info("Group help listing printed!"))
        .catch(this.logger.error);
        return;
    }
    let cmdObject = this.cmds[subCmd];
    if (!cmdObject) {
      message.reply(`Unknown command \`${argv.toString(true)}\``)
      .then(this.logger.info(`Unknown subcommand \`${argv.toString(true)}\``))
      .catch(this.logger.error);
      return;
    }
    if (typeof cmdObject.exec !== "function") {
      this.logger.error("Subcommand %s has'nt valid exec() method!");
      message.reply(`An error occured while executing subcommand \`${argv.toString(true)}\``);
    }
    cmdObject.exec(message, tail);
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
    console.dir(subCmd);
    var help_text = "";
    if (subCmd) {
      if (!this.cmds.hasOwnProperty(subCmd)) {
        return "Unknown subcommand: " + prefix + cmdPhrase + ". Type " + prefix + "help "+ cmd + " to list availaible subcommands.";
      }
      help_text = "Subcommand: " + prefix + cmd + ' ' + subCmd;
      var cmd_context = this.cmds[subCmd];
      if (cmd_context.description && cmd_context.description.length > 0) {
        help_text += "\nDescription: " + this.description;
      }
      if (cmd_context.usage && cmd_context.usage.length > 0) {
        help_text += "\n```\n" + prefix + cmd + " " + cmd_context.usage + "\n```";
      }
    } else {
      help_text = super.printHelp(cmd);
      help_text += "\n\nAvailaible subcomands: \n"
      for (var subCmdName in this.cmds) {
        let subCmd = this.cmds[subCmdName];
        help_text += `\`${prefix}${cmd} ${subCmdName} ${subCmd.Usage}\` - ${subCmd.Description}\n`;
      }
    }
    return help_text;
  }

  get Subcommands() {
    return this.cmds;
  }
}

GroupCommand.DELIMITER = DELIMITER;
module.exports = GroupCommand;
