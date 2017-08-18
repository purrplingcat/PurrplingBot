const PKG = require("./package.json");
const EventEmmiter = require('events');
const LOGGER = require("./lib/logger.js");

var Discord = require('discord.js');
var moment = require('moment');

const VERSION = PKG.version;
const CODENAME = PKG.codename;

const eventBus = new EventEmmiter();
const DEBUG = process.env.DEBUG || false;

var config = {};
var pluginRegistry;

var stats = {
  commandsHandled: 0,
  numberOfReconnection: 0
}

var bot = new Discord.Client();

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
      .then(msg => console.log(`Pong sent to ${msg.author.username} in #${msg.channel.name}`))
      .catch(console.error);
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
      .then(console.log(`Plugin list sent to: #${message.channel.name}\t Requested by: ${message.author.username}`))
      .catch(console.error);
    }
  },
  "version": {
    "description": "PurrplingBot version and codename",
    "exec": function(message) {
      message.channel.send("PurrplingBot version " + VERSION + " '" + CODENAME + "'")
      .then(console.log(`Version info sent to ${message.author.username} in ${message.channel.name}`))
      .catch(console.error);
    }
  }
};

function init() {
  // Init main logger
  LOGGER.init(console);

  // Print info about PurrplingBot
  console.log("* Starting PurrplingBot version " + VERSION + " '" + CODENAME + "'");
  console.log("* Runtime: Node " + process.version + "(" + process.platform + ") Pid: " + process.pid);
  console.log("* Argv: " + process.argv);
  if (DEBUG) console.log("* DEBUG MODE ENABLED !!");

  // Load configuration file
  try {
    config = require("./config.json");
  } catch (err) {
    console.error("*** Configuration failed to load! Check the file config.json");
    console.error(err);
    process.exit(6);
  }

  // Load plugin registry and init plugins
  pluginRegistry = require("./pluginRegistry.js");
  pluginRegistry.init();

  // Switch scope: Set logger prefix to 'Main'
  console.prefix = "Main";

  // Connect bot to Discord!
  console.info("*** Trying to connect Discord");
  bot.login(config.discord.token);
}

function print_cmd_help(cmd) {
  var prefix = config.cmdPrefix;
  if (cmd.startsWith(prefix)) {
    cmd = cmd.substring(prefix.length); //Strip a prefix for command, if was set in arg
  }
  if (!cmds.hasOwnProperty(cmd)) {
    console.log("Requested help for UNKNOWN command: " + prefix + cmd);
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
  console.log("Requested help for command: " + prefix + cmd);
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
  for (cmd_name in cmds) {
    help_text += prefix + cmd_name;
    if (iteration != Object.keys(cmds).length - 1) {
      help_text += ", ";
    }
    iteration++;
  }
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
  cmd = cmd.substring(prefix.length);
  tail = message.content.substring(cmd.length + prefix.length + 1);
  //Block the bot to react own commands
  if (message.author.id === bot.user.id) {
    return false;
  }
  if (cmd == "help") {
    console.log(`Printing requested help from user: ${message.author.username}\t Channel: #${message.channel.name}`);
    message.channel.send(print_help(tail));
    stats.commandsHandled++;
    eventBus.emit("commandHandled", cmd, tail, message);
    return true;
  }
  if (cmds.hasOwnProperty(cmd)) {
    try {
      console.log(`Handle command: ${cmd} \tUser: ${message.author.username}\t Channel: #${message.channel.name}`);
      cmds[cmd].exec(message, tail);
      stats.commandsHandled++;
      eventBus.emit("commandHandled", cmd, tail, message);
    } catch (err) {
      message.reply(`Failed to execute command: ${prefix}${cmd}`);
      console.error("Command '%s%s' execution failed!", prefix, cmd);
      console.error(err);
      console.info("I am still running!");
    }
    return true;
  } else {
    if (prefix.length > 0) {
      message.channel.send(`Unknown command: ${prefix}${cmd}`)
      .then(console.log(`Unknown command: ${cmd} \tUser: ${message.author.username}\t Channel: #${message.channel.name}`))
      .catch(console.error);
    }
  }
  return false;
}

bot.on('ready', function() {
  console.info(`Logged in as ${bot.user.username} - ${bot.user.id} on ${bot.guilds.array().length} servers`);
  stats.numberOfReconnection++;
  eventBus.emit("ready");
  console.info("PurrplingBot READY!");
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
  console.warn("PurrplingBot disconnected from Discord service!")
  console.warn("Reason: #%s - %s", event.code, event.reason);
  console.info("*** Exiting");
  process.exit(15);
});

bot.on('debug', function(info){
  if (DEBUG) console.log(info);
});

bot.on('warn', function(info){
  console.warn(info);
});

bot.on('reconecting', function(){
  console.warn("Connection lost! Trying to reconnect ...");
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
    console.error("Failed to add command: %s", cmdName);
    console.error(err);
  }
}

exports.createLogger = function(prefix) {
  var _logger = new console.Console(process.stdout, process.stderr);
  _logger.prefix = prefix;
  LOGGER.init(_logger); // Init new logger at derivation
  return _logger;
}

//Take init() bot outside main file (call it in another module after require)
exports.init = init

// Start bot runtime - ONLY if was called as main file
if (require.main === module) {
  init();
}
