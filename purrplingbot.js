var Discord = require('discord.io');

const VERSION = "1.1.0-beta";

require('console-stamp')(console, 'dd.mm.yyyy HH:MM:ss.l');
console.log("Starting PurrplingBot version " + VERSION);

try {
  const config = require("./config.json");
} catch (err) {
  console.error("Configuration failed to load! Check the file config.json ");
  console.error(err);
  process.exit(6);
}

var bot = new Discord.Client({
    token: "MzIzMzk3MjU4MDgxMDc1MjAx.DB6raw.U4n_AdA-bGYKFTATc6ACFI2mnTA",
    autorun: true
});

// Basic commands definition
var cmds = {
    "ping": function(bot, metadata) {
         bot.sendMessage({
            to: metadata.channelID,
            message: "pong"
        });
        console.log("Pong sent to %s in %s", metadata.user, metadata.channelID);
    },
    "hello": function(bot, metadata) {
        bot.sendMessage({
            to: metadata.channelID,
            message: "Hello " + metadata.user
        });
        console.log("Greeting %s in %s", metadata.user, metadata.channelID);
    },
    "version": function(bot, metadata) {
        bot.sendMessage({
            to: metadata.channelID,
            message: "PurrplingBot version " + VERSION
        });
        console.log("Version info sent to %s in %s", metadata.user, metadata.channelID);
    }
};

function load_plugins(pluginDir, bot) {
  try {
    var fs = require("fs");
    fs.readdirSync(pluginDir).forEach(file => {
      var plugin;
      try {
        plugin = require(pluginDir + "/" + file);
        console.log("Loaded plugin '" + file + "'");
        if ("init" in plugin) {
          plugin.init(bot);
          console.log("Triggered init for plugin '" + file + "'");
        }
        if ("commands" in plugin) {
          plugin.commands.forEach(cmd => {
            try {
              cmds[cmd] = plugin[cmd];
              console.log("<" + file + "> Registered command: " + cmd);
            } catch (err) {
              console.error("<" + file + "> Can't register command: " + cmd);
              console.error(err);
            }
          })
        }
      } catch (err) {
        console.error("Error while loading plugin ''" + file + "'' ");
        console.error(err);
        process.exit(10);
      }
    })
  } catch (err) {
    console.warn("Plugins can't be loaded! " + err)
  }
}

function print_help() {
    //TODO: Rewrite to StringBuilder
    var help_text = "Availaible commands: ";
    var iteration = 0;
    for (cmd_name in cmds) {
      help_text += cmd_name;
      if (iteration != Object.keys(cmds).length - 1) {
        help_text += ", ";
      }
      iteration++;
    }
    return help_text;
}

function check_message_for_command(bot, metadata, message) {
  var cmd = message.toLowerCase();
  if (cmd == "help") {
    console.log("Printing requested help from user: " + metadata.user);
    bot.sendMessage({
        to: metadata.channelID,
        message: print_help()
    });
  }
  else if (cmds.hasOwnProperty(cmd)) {
      console.log("Handle command: %s \tUser: %s", cmd, metadata.user);
      cmds[cmd](bot, metadata, message);
  }
}

bot.on('ready', function() {
    console.log('Logged in as %s - %s', bot.username, bot.id);
    load_plugins(config.pluginDir, bot);
    console.info("PurrplingBot READY!");
});

bot.on('message', function(user, userID, channelID, message, event) {
  var metadata = {
      user: user,
      userID: userID,
      channelID: channelID
  };
  check_message_for_command(bot, metadata, message); //check and handle cmd
});
