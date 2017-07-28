const PKG = require("./package.json");
const EventEmmiter = require('events');
var Discord = require('discord.js');
var moment = require('moment');

const VERSION = PKG.version;
const CODENAME = PKG.codename;

const eventBus = new EventEmmiter();

var plugins = {};
var plugins_disabled = [];

var stats = {
  commandsHandled: 0,
  numberOfReconnection: 0
}

require('console-stamp')(console, 'dd.mm.yyyy HH:MM:ss.l');
console.log("Starting PurrplingBot version " + VERSION + " '" + CODENAME + "'");

var config = {};
try {
  config = require("./config.json");
} catch (err) {
  console.error("Configuration failed to load! Check the file config.json");
  console.error(err);
  process.exit(6);
}

var bot = new Discord.Client();

// Basic commands definition
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
      var iteration = 0;
      var plugin_list = "Loaded plugins: ";
      for (pluginName in plugins) {
        plugin_list += pluginName;
        if (iteration != Object.keys(plugins).length - 1) {
          plugin_list += ", ";
        }
        iteration++;
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

function load_plugins(pluginDir) {
  try {
    const fs = require("fs");
    const path = require("path");
    const pluginDisabledDefinitionFile = pluginDir + "/plugins_disabled.json";
    if (fs.existsSync(pluginDisabledDefinitionFile)) {
      plugins_disabled = require(pluginDisabledDefinitionFile);
    }
    if (plugins_disabled.length) {
      console.log("Disabled plugins: %s", plugins_disabled);
    }
    fs.readdirSync(pluginDir)
    .filter(file => fs.lstatSync(path.join(pluginDir, file)).isDirectory())
    .forEach(pluginName => {
      var plugin;
      if (plugins_disabled.indexOf(pluginName) < 0) {
        try {
          const pluginPath = pluginDir + "/" + pluginName + "/" + pluginName.toLowerCase() + ".js";
          plugin = require(pluginPath);
          console.log("<" + pluginName + "> Plugin loaded! Source: %s", pluginPath);
          if ("init" in plugin) {
            plugin.init(pluginName);
            console.log("<" + pluginName + "> Triggered init for plugin");
          }
          if ("commands" in plugin) {
            plugin.commands.forEach(cmd => {
              try {
                if ("exec" in plugin[cmd]) {
                  cmds[cmd] = plugin[cmd];
                  console.log("<" + pluginName + "> Registered command: %s", cmd);
                } else {
                  throw new Error("<" + pluginName + "> Command '%s' is invalid! Missing exec() function.", cmd);
                }
              } catch (err) {
                console.error("<" + pluginName + "> Can't register command: '%s'", cmd);
                console.error(err.stack);
                process.exit(12);
              }
              eventBus.emit("commandRegister", cmd);
            });
            plugins[pluginName] = plugin; //Add plugin to plugin registry
            eventBus.emit("pluginLoaded", plugin, pluginName);
          }
        } catch (err) {
          console.error("<" + pluginName + "> Error while loading plugin! Source: %s", pluginPath);
          console.error(err.stack);
          process.exit(10); // PLUGIN FAILURE! Kill the bot
        }
      } else {
        console.log("<%s> Plugin DISABLED - Skip loading", pluginName);
      }
    });
  } catch (err) {
    console.warn("Plugins can't be loaded! " + err)
  }
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
    return;
  }
  if (cmd == "help") {
    console.log(`Printing requested help from user: ${message.author.username}\t Channel: #${message.channel.name}`);
    message.channel.send(print_help(tail));
    stats.commandsHandled++;
    eventBus.emit("commandHandled", cmd, tail, message);
  }
  else if (cmds.hasOwnProperty(cmd)) {
    console.log(`Handle command: ${cmd} \tUser: ${message.author.username}\n Channel: #${message.channel.name}`);
    cmds[cmd].exec(message, tail);
    stats.commandsHandled++;
    eventBus.emit("commandHandled", cmd, tail, message);
  } else {
    if (prefix.length > 0) {
      message.channel.send(`Unknown command: ${prefix}${cmd}`)
      .then(console.log(`Unknown command: ${cmd} \tUser: ${message.author.username}\t Channel: #${message.channel.name}`))
      .catch(console.error);
    }
  }
}

bot.on('ready', function() {
  console.log("----------------------------------------------------------------");
  console.info(`Logged in as ${bot.user.username} - ${bot.user.id} on ${bot.guilds.array().length} servers`);
  stats.numberOfReconnection++;
  eventBus.emit("ready");
  console.info("PurrplingBot READY!");
});

bot.on('message', function(message) {
  check_message_for_command(message); //check and handle cmd
  eventBus.emit("message", message);
});

bot.on('messageUpdate', function(oldMessage, newMessage) {
  check_message_for_command(newMessage); //check and handle cmd
  eventBus.emit("message", newMessage);
});

bot.on('disconnect', function(errMsg, code) {
  console.warn("PurrplingBot disconnected from Discord service!")
  console.warn("#%s - %s", code, errMsg);
  console.log("*** Trying to reconnect");
  try {
    bot.connect();
  } catch (err) {
    console.error("Can't connect to discord!");
    console.error(err);
    process.exit(100);
  }
});

exports.getPluginRegistry = function () {
  return plugins;
}

exports.getDisabledPlugins = function() {
  return plugins_disabled;
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

//Load plugins and connect bot
load_plugins(config.pluginDir, bot);
bot.login(config.discord.token);
