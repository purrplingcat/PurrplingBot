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

  __exec(cmdMessage, authority) {
    if (!cmdMessage.hasArgs()) {
      var aliases = this.commander.Aliases;
      cmdMessage.channel.send("List of aliases: " + UTILS.formatAliasList(aliases, this.commander.Prefix))
      .then(AliasBuiltin.LOGGER.info(`Aliases list sent to #${cmdMessage.channel.name} requested by: ${cmdMessage.caller.username}`))
      .catch(AliasBuiltin.LOGGER.error);
      return;
    }
    if (!authority.hasPermission(authority.constructor.FLAGS.ADMINISTRATOR)) {
      cmdMessage.reply("You are not permitted for add alias!")
      .catch(AliasBuiltin.LOGGER.error);
      AliasBuiltin.LOGGER.info(`User ${cmdMessage.caller.username} is not permitted for add alias!`);
      return;
    }
    var argv = cmdMessage.toArgv().shift();
    var alias = argv.command;
    var aliasedCommand = argv.argsString;
    var prefix = this.commander.Prefix || "";
    if (!alias || !aliasedCommand) {
      cmdMessage.reply("Missing or wrong some parameters!")
      .catch(AliasBuiltin.LOGGER.error);
      AliasBuiltin.LOGGER.info("Missing or wrong parameters for command alias!");
      return;
    }
    // Remove prefix from aliasName
    if (alias.startsWith(prefix)) {
      alias = alias.substr(prefix.length);
    }
    // Remove prefix from aliased command
    if (aliasedCommand.startsWith(prefix)) {
      aliasedCommand = aliasedCommand.substr(prefix.length);
    }
    this.core.addAlias(alias, aliasedCommand);
    this.storeAliases();
    AliasBuiltin.LOGGER.log(`User ${cmdMessage.caller.username} created alias '${alias}' to '${aliasedCommand}' in #${cmdMessage.channel.name}`);
    cmdMessage.channel.send(`Alias \`${prefix}${alias}\` to \`${prefix}${aliasedCommand}\` created!`)
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
    this.restrictions = "ADMINISTRATOR";
    this.tag = "builtin";
  }

  __exec(cmdMessage) {
    if (!cmdMessage.hasArgs()) {
      cmdMessage.reply("Invalid arguments.")
      .catch(AliasRemoveBuiltin.LOGGER.error);
      AliasRemoveBuiltin.LOGGER.info("Invalid parameters for remove an alias!");
      return;
    }

    var prefix = this.commander.Prefix || "";
    var aliases = this.commander.Aliases;
    var [ alias ] = cmdMessage.args;
    if (alias in aliases) {
      delete aliases[alias];
      this.storeAliases();
      AliasRemoveBuiltin.LOGGER.info("Removed alias: %s", alias);
      cmdMessage.reply(`Alias \`${prefix}${alias}\` removed!`)
      .then(AliasRemoveBuiltin.LOGGER.log(`Sent info about alias SUCCESS remove to #${cmdMessage.channel.name}`))
      .catch(AliasRemoveBuiltin.LOGGER.error);
    } else {
      AliasRemoveBuiltin.LOGGER.info("Unknown alias: %s - Can't remove", alias);
      cmdMessage.reply(`Alias \`${prefix}${alias}\` is not found! Can't remove.`)
      .then(AliasRemoveBuiltin.LOGGER.log(`Sent info about alias FAILED remove to #${cmdMessage.channel.name}`))
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

  __exec(cmdMessage) {
    cmdMessage.reply("pong")
    .then(PingBuiltin.LOGGER.info(`Pong sent to ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
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

  __exec(cmdMessage) {
    var plugins = this.core.getPluginRegistry().Plugins;
    var plugins_disabled = this.core.getPluginRegistry().DisabledPlugins;
    if (cmdMessage.hasArgs()) {
      var [ pluginName ] = cmdMessage.args;
      var plugin = plugins[pluginName];
      if (!plugin) {
        PluginsBuiltin.LOGGER.info(`Plugin '${tail}' not exists or disabled!`);
        cmdMessage.channel.send(`Plugin '${tail}' not exists or disabled!`);
        return;
      }
      var info = "Plugin: " + pluginName + "\n";
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
      cmdMessage.channel.send(info);
      return;
    }
    var plugin_list = "Loaded plugins: ```";
    plugin_list += Object.keys(plugins).sort().join(', ');
    plugin_list += "\n```";
    if (plugins_disabled.length > 0) {
      plugin_list += "\nDisabled plugins: \n```" + plugins_disabled.sort().join(", ") + "\n```";
    }
    cmdMessage.channel.send(plugin_list)
    .then(PluginsBuiltin.LOGGER.info(`Plugin list sent to: #${cmdMessage.channel.name}\t Requested by: ${cmdMessage.caller.username}`))
    .catch(PluginsBuiltin.LOGGER.error);
  }
}

class UptimeBuiltin extends Command {
  constructor(commander){
    super(commander);
    this.description = "Get uptime of bot";
    this.tag = "builtin";
  }

  __exec(cmdMessage) {
    var bot = this.core.DiscordClient;
    cmdMessage.channel.send(`Uptime: ${moment(bot.readyAt).twix(new Date()).humanizeLength()} \nReady at: ${moment(bot.readyAt).format("DD.MM.YYYY HH:mm:ss")}`)
    .then(UptimeBuiltin.LOGGER.info(`Uptime sent to #${cmdMessage.channel.name} requested by: ${cmdMessage.caller.username}`))
    .catch(UptimeBuiltin.LOGGER.error);
  }
}

class VersionBuiltin extends Command {
  constructor(commander){
    super(commander);
    this.description = "PurrplingBot version and codename";
    this.tag = "builtin";
  }

  __exec(cmdMessage) {
    cmdMessage.channel.send("PurrplingBot version " + this.core.Version + " '" + this.core.Codename + "'")
    .then(VersionBuiltin.LOGGER.info(`Version info sent to ${cmdMessage.caller.username} in ${cmdMessage.channel.name}`))
    .catch(VersionBuiltin.LOGGER.error);
  }
}

BuiltinCommands.LOGGER = logger;
module.exports = BuiltinCommands;
