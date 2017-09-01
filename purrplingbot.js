const PKG = require("./package.json");
const EventEmmiter = require('events');
const LOGGER = require("./lib/logger.js");

var Discord = require('discord.js');
var moment = require('moment');
var logger;

const VERSION = PKG.version;
const CODENAME = PKG.codename;

const eventBus = new EventEmmiter();
const DEBUG = process.env.DEBUG || 0;

var config = {};
var pluginRegistry;

var stats = {
  commandsHandled: 0,
  numberOfReconnection: 0
}

var bot = new Discord.Client();

var aliases = {
  "h": "help"
};

/*
 * @note Basic commands definition
 * @property description
 * @property usage (optional)
 * @function exec @args Message message, String tail
 */
var cmds = {
  "alias": {
    "description": "Create an alias or list aliases",
    "usage": "[<aliasName> <command>]",
    "exec": function(message, tail) {
      if (!tail.length) {
        message.channel.send("Aliases: ```\n" + Object.keys(aliases) + "```")
        .then(logger.info(`Aliases list sent to #${message.channel.name} requested by: ${message.author.username}`))
        .catch(logger.error);
        return;
      }
      if (!config.admins || config.admins.indexOf(message.author.username) < 0) {
        message.reply("You are not permitted for add alias!")
        .catch(logger.error);
        logger.info(`User ${message.author.username} is not permitted for add alias!`);
        return;
      }
      var [alias, command] = tail.split(' ');
      var prefix = config.cmdPrefix || "";
      if (!alias || !command) {
        message.reply("Missing or wrong some parameters!")
        .catch(logger.error);
        logger.info("Missing or wrong parameters for command alias!");
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
      aliases[alias] = command;
      logger.log(`User ${message.author.username} created alias '${alias}' to '${command}' in #${message.channel.name}`);
      message.channel.send(`Alias \`${prefix}${alias}\` to \`${prefix}${command}\` created!`)
      .catch(logger.error);
    }
  },
  "alias-remove": {
    "description": "Remove an alias",
    "usage": "<aliasName>",
    "exec": function(message, tail) {
      var prefix = config.cmdPrefix || "";
      if (!config.admins || config.admins.indexOf(message.author.username) < 0) {
        message.reply("You are not permitted for remove alias!")
        .catch(logger.error);
        logger.info(`User ${message.author.username} is not permitted for remove alias!`);
        return;
      }
      if (!tail) {
        message.reply("Invalid arguments.")
        .catch(logger.error);
        logger.info("Invalid parameters for remove an alias!");
        return;
      }
      if (tail in aliases) {
        delete aliases[tail];
        logger.info("Removed alias: %s", tail);
        message.reply(`Alias \`${prefix}${tail}\` removed!`)
        .then(logger.log(`Sent info about alias SUCCESS remove to #${message.channel.name}`))
        .catch(logger.error);
      } else {
        logger.info("Unknown alias: %s - Can't remove", tail);
        message.reply(`Alias \`${prefix}${tail}\` is not found! Can't remove.`)
        .then(logger.log(`Sent info about alias FAILED remove to #${message.channel.name}`))
        .catch(logger.error);
      }
    }
  },
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
    "exec": function(message) {
      var plugins = pluginRegistry.getPlugins();
      var plugins_disabled = pluginRegistry.getDisabledPlugins();
      var iteration = 0;
      var plugin_list = "Loaded plugins: ";
      for (pluginName in plugins) {
        plugin_list += pluginName;
        if (iteration != Object.keys(plugins).length - 1) {
          plugin_list += ", ";
        }
        iteration++;
      }
      if (plugins_disabled.length > 0) {
        plugin_list += "\nDisabled plugins: " + plugins_disabled;
      }
      message.channel.send(plugin_list)
      .then(logger.info(`Plugin list sent to: #${message.channel.name}\t Requested by: ${message.author.username}`))
      .catch(logger.error);
    }
  },
  "version": {
    "description": "PurrplingBot version and codename",
    "exec": function(message) {
      message.channel.send("PurrplingBot version " + VERSION + " '" + CODENAME + "'")
      .then(logger.info(`Version info sent to ${message.author.username} in ${message.channel.name}`))
      .catch(logger.error);
    }
  }
};

function check_conf() {
  if (!config.discord) {
    logger.error("Discord scope not defined in config!");
    process.exit(6);
  }
  if (!config.discord.token) {
    logger.error("Token not defined in discord scope!");
    process.exit(6);
  }
  logger.log("Configuration check is OK!");
}

function print_bot_info() {
  var _logger = LOGGER.createLogger();
  _logger.info("* Starting PurrplingBot version " + VERSION + " '" + CODENAME + "'");
  _logger.info("* Runtime: Node " + process.version + "(" + process.platform + ") Pid: " + process.pid);
  _logger.info("* Argv: " + process.argv);
  if (DEBUG > 0) _logger.log("* DEBUG MODE ENABLED !! (level: %s)", DEBUG);
}

function init() {
  // Init main logger
  logger = LOGGER.createLogger("Core");

  // Print info about PurrplingBot
  print_bot_info();
  logger.info("Starting PurrplingBot ...");

  // Load configuration file
  try {
    const Configurator = require("./lib/configurator.js");
    config = Configurator.loadConfiguration("./config.json");
  } catch (err) {
    logger.error("*** Configuration failed to load! Check the config file.");
    logger.error(err);
    process.exit(6);
  }

  // Check configuration
  check_conf();

  // Load plugin registry and init plugins
  pluginRegistry = require("./pluginRegistry.js");
  pluginRegistry.init();

  // Print a stats to log
  logger.info("* Registered commands: %s", Object.keys(cmds).length);
  logger.info("* Loaded plugins: %s", pluginRegistry.countPlugins());
  logger.info("* Disabled plugins: %s", pluginRegistry.countDisabledPlugins());

  // Connect bot to Discord!
  logger.info("*** Trying to connect Discord");
  bot.login(config.discord.token);
}

function print_cmd_help(cmd) {
  var prefix = config.cmdPrefix;
  if (cmd.startsWith(prefix)) {
    cmd = cmd.substring(prefix.length); //Strip a prefix for command, if was set in arg
  }
  if (!cmds.hasOwnProperty(cmd)) {
    logger.info("Requested help for UNKNOWN command: " + prefix + cmd);
    return "Unknown command: " + prefix + cmd + ". Type " + prefix + "help to list availaible commands.";
  }
  var help_text = "Command: " + prefix + cmd;
  var cmd_context = cmds[cmd];
  if ("description" in cmd_context) {
    help_text += "\nDescription: " + cmd_context["description"];
  }
  if ("usage" in cmd_context) {
    help_text += "\nUsage: " + prefix + cmd + " " + cmd_context["usage"];
  }
  logger.info("Requested help for command: " + prefix + cmd);
  return help_text;
}

function print_help(cmd) {
  if (cmd.trim().length > 0 && cmd != null) { //cmd is NOT empty and NOT null
    return print_cmd_help(cmd);
  }
  //TODO: Rewrite to StringBuilder
  var prefix = config.cmdPrefix;
  var help_text = "Availaible commands: ";
  var iteration = 0;
  var _cmds = Object.keys(cmds).concat(Object.keys(aliases));
  _cmds.forEach(cmd_name => {
    help_text += "`" + prefix + cmd_name + "`";
    if (iteration != _cmds.length - 1) {
      help_text += ", ";
    }
    iteration++;
  });
  help_text += `\n\nFor more information type '${prefix}help <command>'`;
  return help_text;
}

/**
* @param message - Channel message driver
*/
function check_message_for_command(message) {
  var ex = message.content.split(" ");
  var prefix = config.cmdPrefix;
  var cmd = ex[0].toLowerCase();
  if (!cmd.startsWith(prefix)) {
    return;
  }

  //Block the bot to react own commands
  if (message.author.id === bot.user.id) {
    return false;
  }

  cmd = cmd.substring(prefix.length);
  tail = message.content.substring(cmd.length + prefix.length + 1);

  if (cmd in aliases) {
    var aliased = aliases[cmd];
    logger.info(`Called alias '${cmd}' for '${aliased}' on #${message.channel.name} by: ${message.author.username}`);
    var argv = aliased.split(' ');
    cmd = argv.shift();
    tail = tail + argv.join(' ');
    logger.log("Aliased cmd: %s Tail: %s", cmd, tail);
  }
  if (cmd == "help") {
    logger.info(`Printing requested help from user: ${message.author.username}\t Channel: #${message.channel.name}`);
    if (tail in aliases) {
      message.channel.send(`**${prefix}${tail}** is alias for **${prefix}${aliases[tail]}**`)
      .catch(logger.error);
      return true;
    }
    message.channel.send(print_help(tail));
    stats.commandsHandled++;
    eventBus.emit("commandHandled", cmd, tail, message);
    return true;
  }
  if (cmds.hasOwnProperty(cmd)) {
    try {
      logger.info(`Handle command: ${cmd} (${tail})\tUser: ${message.author.username}\t Channel: #${message.channel.name}`);
      cmds[cmd].exec(message, tail);
      stats.commandsHandled++;
      eventBus.emit("commandHandled", cmd, tail, message);
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

bot.on('ready', function() {
  logger.info(`Logged in as ${bot.user.username} - ${bot.user.id} on ${bot.guilds.array().length} servers`);
  stats.numberOfReconnection++;
  eventBus.emit("ready");
  logger.info("PurrplingBot READY!");
});

bot.on('message', function(message) {
  var isCmd = check_message_for_command(message); //check and handle cmd
  eventBus.emit("message", message, isCmd);
});

bot.on('messageUpdate', function(oldMessage, newMessage) {
  var isCmd = check_message_for_command(newMessage); //check and handle cmd
  eventBus.emit("messageUpdate", oldMessage, newMessage, isCmd);
});

bot.on('disconnect', function(event) {
  logger.warn("PurrplingBot disconnected from Discord service!")
  logger.warn("Reason: #%s - %s", event.code, event.reason);
  logger.info("*** Exiting");
  process.exit(15);
});

bot.on('debug', function(info){
  if (DEBUG > 1) logger.log(info);
});

bot.on('warn', function(info){
  logger.warn(info);
});

bot.on('reconecting', function(){
  logger.warn("Connection lost! Trying to reconnect ...");
});

exports.getPluginRegistry = function () {
  return pluginRegistry;
}

exports.getCommandRegistry = function () {
  return cmds;
}

exports.getEventBus = function () {
  return eventBus;
}

exports.getDiscordClient = function() {
  return bot;
}

exports.getStats = function() {
  return stats;
}

exports.addCommand = function(cmdName, cmdObject) {
  try {
    cmds[cmdName] = cmdObject;
  } catch (err) {
    logger.error("Failed to add command: %s", cmdName);
    logger.error(err);
  }
}

exports.getConfiguration = function(){
  return config;
}

// createLogger() availaible for all modules
exports.createLogger = LOGGER.createLogger;

//Take init() bot outside main file (call it in another module after require)
exports.init = init

// Start bot runtime - ONLY if was called as main file
if (require.main === module) {
  init();
}
