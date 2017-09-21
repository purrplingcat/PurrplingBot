const LOGGER = require("../lib/logger");
const UTILS = require("../lib/utils");

var logger = LOGGER.createLogger("Commander");

class Commander {

  constructor(core, cmdPrefix) {
    this.core = core;
    this.cmdPrefix = cmdPrefix;
    this._commandsHandledCount = 0;
    this.aliases = {};
    this.cmds = {
      "ping": {
        "description": "Ping the bot and get pong.",
        "exec": function(message) {
          message.reply("pong")
          .then(msg => logger.info(`Pong sent to ${msg.author.username} in #${msg.channel.name}`))
          .catch(logger.error);
        }
      },
      "plugins": {
        "description": "Get list of loaded plugins",
        "usage": "[<pluginName>]",
        "exec": function(message) {
          var plugins = pluginRegistry.getPlugins();
          var plugins_disabled = pluginRegistry.getDisabledPlugins();
          if (tail) {
            var plugin = plugins[tail];
            if (!plugin) {
              logger.info(`Plugin '${tail}' not exists or disabled!`);
              message.channel.send(`Plugin '${tail}' not exists or disabled!`);
              return;
            }
            var info = "Plugin: " + tail + "\n";
            var prefix = this.cmdPrefix;
            info += "Registered commands: `" + (plugin.commands ? plugin.commands.map(el => {return prefix + el }).join(', ') : "no commands") + "`\n";
            var status = {};
            if (typeof(plugin.status) == "function") status = plugin.status();
            if (status) {
              for (statKey in status) {
                let statVal = status[statKey];
                info += statKey + ": " + statVal + "\n";
              }
            }
            message.channel.send(info);
            return;
          }
          var plugin_list = "Loaded plugins: ```";
          plugin_list += Object.keys(plugins).join(', ');
          plugin_list += "\n```";
          if (plugins_disabled.length > 0) {
            plugin_list += "\nDisabled plugins: \n```" + plugins_disabled.join(", ") + "\n```";
          }
          message.channel.send(plugin_list)
          .then(logger.info(`Plugin list sent to: #${message.channel.name}\t Requested by: ${message.author.username}`))
          .catch(logger.error);
        }
      },
      "version": {
        "description": "core version and codename",
        "exec": function(message) {
          message.channel.send("core version " + VERSION + " '" + CODENAME + "'")
          .then(logger.info(`Version info sent to ${message.author.username} in ${message.channel.name}`))
          .catch(logger.error);
        }
      }
    };
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
        this.cmds[cmd].exec(message, tail);
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

  addAlias(aliasName, commandString) {
    try {
      aliases[aliasName] = commandString;
    } catch (err) {
      logger.error("Failed to add alias: %s to: %s", aliasName, commandString);
      logger.error(err);
    }
  }
}

module.exports = Commander;
