const PKG = require("../package.json");
const EventEmmiter = require('events');
const LOGGER = require("../lib/logger.js");
const UTILS = require("../lib/utils.js");

var Discord = require('discord.js');
var moment = require('moment');
var logger;

const VERSION = PKG.version;
const CODENAME = PKG.codename;

const eventBus = new EventEmmiter();
const DEBUG = process.env.DEBUG || 0;

var config = {};
var pluginRegistry;
var store;

var stats = {
  commandsHandled: 0,
  numberOfReconnection: 0
}

var bot = new Discord.Client();

var aliases = {};

/*
 * @note Basic commands definition
 * @property description
 * @property usage (optional)
 * @function exec @args Message message, String tail
 */
var cmds = {
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
        var prefix = config.cmdPrefix;
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

  // Load configuration
  const Configurator = require("../lib/configurator.js");
  try {
    config = Configurator.loadConfiguration("config/config");
  } catch (err) {
    logger.error("*** Configuration failed to load! Check the config file.");
    logger.error(err);
    process.exit(6);
  }

  // Check configuration
  check_conf();

  // Init storage
  const Storage = require("../lib/storage.js");
  const STORAGE_CONF = config.storage || {};
  store = Storage(STORAGE_CONF.file || "config/storage.json");

  // No data in storage? Import defaults
  if (!store.countScopes()) {
    logger.info("Storage has no data! Restore defaults");
    store.import("extras/store.defaults.json");
    store.flush();
  };

  // Restore aliases
  aliases = store.restoreScope("aliases");

  // Load plugin registry and init plugins
  pluginRegistry = require("./pluginRegistry.js");
  pluginRegistry.init();

  // Autosave enabled? Set interval for save storage
  if (STORAGE_CONF.autosave || true) {
    const INTERVAL = STORAGE_CONF.autosaveInterval || 90; // Interval in seconds
    bot.setInterval(function () {
      if (DEBUG > 1) logger.log("Triggered store autosave interval!");
      store.flush();
    }, INTERVAL * 1000);
    logger.info("Store autosave started! Interval: %ss", INTERVAL);
  }

  // Print a stats to log
  logger.info("* Registered commands: %s", Object.keys(cmds).length);
  logger.info("* Loaded plugins: %s", pluginRegistry.countPlugins());
  logger.info("* Disabled plugins: %s", pluginRegistry.countDisabledPlugins());

  // Connect bot to Discord!
  logger.info("*** Trying to connect Discord");
  bot.login(config.discord.token);
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
    if (tail) {
      logger.info("Request help for command %s%s", prefix, tail);
      message.channel.send(UTILS.printCmdHelp(tail, cmds, prefix));
    }
    else {
      var _cmds = Object.keys(cmds).concat(Object.keys(aliases));
      message.channel.send(UTILS.printHelp(_cmds, prefix));
    }
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

function log_event(msg, type = "Bot", level = "INFO") {
  const eventLoggerConf = config.eventLogger || {};
  const enabled = eventLoggerConf.enabled || false;
  const channelID = eventLoggerConf.loggingChannelID;
  if (!enabled) {
    logger.log("Can't send log event - EventLogger is DISABLED!");
    return;
  }
  if (!channelID) {
    logger.error("Can't send log event - loggingChannelID is EMPTY!");
    return;
  }
  var channel = bot.channels.find('id', channelID);
  if (!channel) {
    logger.log("Can't send log event - Unknown event logging channel: %s", channelID);
    return;
  }
  if (level == "DEBUG" && DEBUG < 1) return;
  let timestamp = moment(new Date()).format("MM/DD HH:mm:ss");
  channel.send(`${timestamp}: _${level}_ - **${type}** - ${msg}`)
  .then(logger.info(`Event log ${type} - "${msg}" sent to #${channel.name} level: ${level}`))
  .catch(logger.error);
}

bot.on('ready', function() {
  logger.info(`Logged in as ${bot.user.username} - ${bot.user.id} on ${bot.guilds.array().length} servers`);
  stats.numberOfReconnection++;
  eventBus.emit("ready");
  log_event("PurrplingBot is ready and works!", "BotReady");
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

exports.getDiscordClient = function() {
  return bot;
}

exports.getStats = function() {
  return stats;
}

exports.getAliases = function() {
  return aliases;
}

exports.addCommand = function(cmdName, cmdObject) {
  try {
    cmds[cmdName] = cmdObject;
  } catch (err) {
    logger.error("Failed to add command: %s", cmdName);
    logger.error(err);
  }
}

exports.addAlias = function (aliasName, command) {
  try {
    aliases[aliasName] = command;
  } catch (err) {
    logger.error("Failed to add alias: %s to: %s", aliasName, command);
    logger.error(err);
  }
}

exports.emit = eventBus.emit;

exports.on = eventBus.on;

exports.getConfiguration = function(){
  return config;
}

exports.getStore = function() {
  return store;
}

exports.logEvent = log_event;

// createLogger() availaible for all modules
exports.createLogger = LOGGER.createLogger;

//Take init() bot outside main file (call it in another module after require)
exports.init = init

if (require.main === module) {
  console.log("To start PurrplingBot please run purrplingbot.js instead.");
}
