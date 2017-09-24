const LOGGER = require("../../lib/logger");
const UTILS = require("../../lib/utils");
const Command = require("./command");
const FS = require('fs');
const PATH = require('path');
const moment = require('moment');
const ALIASES_STORE = "aliases";

require('twix');
var logger = LOGGER.createLogger("BuiltinCommands");

class BuiltinCommands {

  static registerBuiltinCommands(commander, commandsDir) {
    commander.addCommand("alias", new AliasBuiltin(commander));
    commander.addCommand("alias_remove", new AliasRemoveBuiltin(commander));
    commander.addCommand("ping", new PingBuiltin(commander));
    commander.addCommand("plugins", new PluginsBuiltin(commander));
    commander.addCommand("uptime", new UptimeBuiltin(commander));
    commander.addCommand("version", new VersionBuiltin(commander));
    logger.info("Builtin commands registered!");
  }
}

/* Builtin commands */

class AliasBuiltin extends Command {
  constructor(commander){
    super(commander);
    this.description = "Create an alias or list aliases";
    this.usage = "[<aliasName> <command>]";
    this.guildChannelOnly = true;
    this.tag = "builtin";
  }

  __exec(message, tail, authority) {
    if (!tail.length) {
      var aliases = this.commander.Aliases;
      message.channel.send("List of aliases: " + UTILS.formatAliasList(aliases, this.commander.Prefix))
      .then(AliasBuiltin.LOGGER.info(`Aliases list sent to #${message.channel.name} requested by: ${message.author.username}`))
      .catch(AliasBuiltin.LOGGER.error);
      return;
    }
    if (!authority.hasPermission(authority.constructor.FLAGS.ADMINISTRATOR)) {
      message.reply("You are not permitted for add alias!")
      .catch(AliasBuiltin.LOGGER.error);
      AliasBuiltin.LOGGER.info(`User ${message.author.username} is not permitted for add alias!`);
      return;
    }
    var argv = tail.split(' ');
    var alias = argv.shift();
    var command = argv.join(' ');
    var prefix = this.commander.Prefix || "";
    if (!alias || !command) {
      message.reply("Missing or wrong some parameters!")
      .catch(AliasBuiltin.LOGGER.error);
      AliasBuiltin.LOGGER.info("Missing or wrong parameters for command alias!");
      return;
    }
    // Remove prefix from aliasName
    if (alias.startsWith(prefix)) {
      alias = alias.substr(prefix.length);
    }
    // Remove prefix from aliased command
    if (command.startsWith(prefix)) {
      command = command.substr(prefix.length);
    }
    this.core.addAlias(alias, command);
    this.storeAliases();
    AliasBuiltin.LOGGER.log(`User ${message.author.username} created alias '${alias}' to '${command}' in #${message.channel.name}`);
    message.channel.send(`Alias \`${prefix}${alias}\` to \`${prefix}${command}\` created!`)
    .catch(AliasBuiltin.LOGGER.error);
  }

  storeAliases() {
    var aliases = this.commander.Aliases;
    this.core.Store.storeScope(ALIASES_STORE, aliases)
    .flush();
  }
}

class AliasRemoveBuiltin extends AliasBuiltin {
  constructor(commander){
    super(commander);
    this.description = "Remove an alias";
    this.usage = "<aliasName>";
    this.guildChannelOnly = true;
    this.tag = "builtin";
  }

  __exec(message, tail, authority) {
    if (!authority.hasPermission(authority.FLAGS.ADMINISTRATOR)) {
      message.reply("You are not permitted for remove alias!")
      .catch(AliasRemoveBuiltin.LOGGER.error);
      AliasRemoveBuiltin.LOGGER.info(`User ${message.author.username} is not permitted for remove alias!`);
      return;
    }
    if (!tail) {
      message.reply("Invalid arguments.")
      .catch(AliasRemoveBuiltin.LOGGER.error);
      AliasRemoveBuiltin.LOGGER.info("Invalid parameters for remove an alias!");
      return;
    }

    var prefix = this.commander.Prefix || "";
    var aliases = this.commander.Aliases;
    if (tail in aliases) {
      delete aliases[tail];
      this.storeAliases();
      AliasRemoveBuiltin.LOGGER.info("Removed alias: %s", tail);
      message.reply(`Alias \`${prefix}${tail}\` removed!`)
      .then(AliasRemoveBuiltin.LOGGER.log(`Sent info about alias SUCCESS remove to #${message.channel.name}`))
      .catch(AliasRemoveBuiltin.LOGGER.error);
    } else {
      AliasRemoveBuiltin.LOGGER.info("Unknown alias: %s - Can't remove", tail);
      message.reply(`Alias \`${prefix}${tail}\` is not found! Can't remove.`)
      .then(AliasRemoveBuiltin.LOGGER.log(`Sent info about alias FAILED remove to #${message.channel.name}`))
      .catch(AliasRemoveBuiltin.LOGGER.error);
    }
  }
}

class PingBuiltin extends Command {
  constructor(commander){
    super(commander);
    this.description = "Ping the bot and get pong.";
    this.tag = "builtin";
  }

  __exec(message) {
    message.reply("pong")
    .then(msg => PingBuiltin.LOGGER.info(`Pong sent to ${msg.author.username} in #${msg.channel.name}`))
    .catch(PingBuiltin.LOGGER.error);
  }
}

class PluginsBuiltin extends Command {
  constructor(commander){
    super(commander);
    this.description = "Get list of loaded plugins";
    this.usage = "[<pluginName>]";
    this.tag = "builtin";
  }

  __exec(message, tail) {
    var plugins = this.core.getPluginRegistry().Plugins;
    var plugins_disabled = this.core.getPluginRegistry().DisabledPlugins;
    if (tail) {
      var plugin = plugins[tail];
      if (!plugin) {
        PluginsBuiltin.LOGGER.info(`Plugin '${tail}' not exists or disabled!`);
        message.channel.send(`Plugin '${tail}' not exists or disabled!`);
        return;
      }
      var info = "Plugin: " + tail + "\n";
      var prefix = this.commander.Prefix;
      info += "Registered commands: `" + (plugin.commands ? plugin.commands.map(el => {return prefix + el }).sort().join(', ') : "no commands") + "`\n";
      var status = {};
      if (typeof(plugin.status) == "function") status = plugin.status();
      if (status) {
        for (var statKey in status) {
          let statVal = status[statKey];
          info += statKey + ": " + statVal + "\n";
        }
      }
      message.channel.send(info);
      return;
    }
    var plugin_list = "Loaded plugins: ```";
    plugin_list += Object.keys(plugins).sort().join(', ');
    plugin_list += "\n```";
    if (plugins_disabled.length > 0) {
      plugin_list += "\nDisabled plugins: \n```" + plugins_disabled.sort().join(", ") + "\n```";
    }
    message.channel.send(plugin_list)
    .then(PluginsBuiltin.LOGGER.info(`Plugin list sent to: #${message.channel.name}\t Requested by: ${message.author.username}`))
    .catch(PluginsBuiltin.LOGGER.error);
  }
}

class UptimeBuiltin extends Command {
  constructor(commander){
    super(commander);
    this.description = "Get uptime of bot";
    this.tag = "builtin";
  }

  __exec(message) {
    var bot = message.client;
    message.channel.send(`Uptime: ${moment(bot.readyAt).twix(new Date()).humanizeLength()} \nReady at: ${moment(bot.readyAt).format("DD.MM.YYYY HH:mm:ss")}`)
    .then(UptimeBuiltin.LOGGER.info(`Uptime sent to #${message.channel.name} requested by: ${message.author.username}`))
    .catch(UptimeBuiltin.LOGGER.error);
  }
}

class VersionBuiltin extends Command {
  constructor(commander){
    super(commander);
    this.description = "PurrplingBot version and codename";
    this.tag = "builtin";
  }

  __exec(message) {
    message.channel.send("PurrplingBot version " + this.core.Version + " '" + this.core.Codename + "'")
    .then(VersionBuiltin.LOGGER.info(`Version info sent to ${message.author.username} in ${message.channel.name}`))
    .catch(VersionBuiltin.LOGGER.error);
  }
}

BuiltinCommands.LOGGER = logger;
module.exports = BuiltinCommands;
