var PurrplingBot = require("./purrplingbot.js");
var eventBus = PurrplingBot.getEventBus();

const CONFIG = require("./config.json");
const PLUGIN_DIR = "./plugins";

var plugins = {};
var plugins_disabled = [];

function load_plugins(pluginDir) {
  try {
    console.log("Plugin loader process started!");
    const fs = require("fs");
    const path = require("path");
    const pluginDisabledDefinitionFile = pluginDir + "/plugins_disabled.json";

    if (plugins_disabled.length) {
      console.log("Disabled plugins: %s", plugins_disabled);
    }
    fs.readdirSync(pluginDir)
    .filter(file => fs.lstatSync(path.join(pluginDir, file)).isDirectory())
    .forEach(pluginName => {
      // Switch scope: Current plugin scope
      console.prefix = pluginName

      var plugin;
      const pluginPath = pluginDir + "/" + pluginName + "/" + pluginName.toLowerCase() + ".js";
      if (plugins_disabled.indexOf(pluginName) < 0) {
        try {
          plugin = require(pluginPath);
          console.log("Plugin loaded! Source: %s", pluginPath);
          if ("init" in plugin) {
            plugin.init(pluginName);
            console.log(" Triggered init() for plugin");
          }
          if ("commands" in plugin) {
            plugin.commands.forEach(cmd => {
              try {
                if ("exec" in plugin[cmd]) {
                  PurrplingBot.addCommand(cmd, plugin[cmd]);
                  console.log("Registered command: %s", cmd);
                } else {
                  throw new Error("Command '%s' is invalid! Missing exec() function.", cmd);
                }
              } catch (err) {
                console.error("Can't register command: '%s'", cmd);
                console.error(err.stack);
                process.exit(12);
              }
              eventBus.emit("commandRegister", cmd);
            });
          }
          console.info("Initialization DONE!");
          plugins[pluginName] = plugin; //Add plugin to plugin registry
          eventBus.emit("pluginLoaded", plugin, pluginName);
        } catch (err) {
          console.error("Error while loading plugin! Source: %s", pluginPath);
          console.error(err.stack);
          process.exit(10); // PLUGIN FAILURE! Kill the bot
        }
      } else {
        console.log("Plugin DISABLED - Skip loading");
      }
    });
    // Switch scope back: PluginLoader
    console.prefix = "PluginLoader"
    eventBus.emit("pluginsLoaded", plugins);
    console.log("Plugin loader process was SUCCESFULL!");
  } catch (err) {
    console.error("Plugins can't be loaded!")
    console.error(err);
    process.exit(8);
  }
}

exports.init = function() {
  // Switch scope: PluginLoader
  console.prefix = "PluginLoader"

  if (CONFIG.pluginsDisabled && CONFIG.pluginsDisabled instanceof Array) {
    plugins_disabled = CONFIG.pluginsDisabled; // Fetch disabled plugins from config
  }
  load_plugins(PLUGIN_DIR);
}

exports.getPlugins = function () {
  return plugins;
}

exports.getDisabledPlugins = function() {
  return plugins_disabled;
}
