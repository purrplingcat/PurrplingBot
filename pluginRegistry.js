var PurrplingBot = require("./purrplingbot.js");
var eventBus = PurrplingBot.getEventBus();

const CONFIG = require("./config.json");
const PLUGIN_DIR = "./plugins";

var plugins = {};
var plugins_disabled = [];
var logger;

function load_plugins(pluginDir) {
  try {
    logger.info("*** Plugin loader process started!");
    const fs = require("fs");
    const path = require("path");
    const pluginDisabledDefinitionFile = pluginDir + "/plugins_disabled.json";

    if (plugins_disabled.length) {
      logger.info("Disabled plugins: %s", plugins_disabled);
    }
    fs.readdirSync(pluginDir)
    .filter(file => fs.lstatSync(path.join(pluginDir, file)).isDirectory())
    .forEach(pluginName => {
      logger.info("Trying to load plugin: %s", pluginName);
      // Create internal logger for different plugin loader process
      var _logger = PurrplingBot.createLogger(pluginName);

      var plugin;
      const pluginPath = pluginDir + "/" + pluginName + "/" + pluginName.toLowerCase() + ".js";
      if (plugins_disabled.indexOf(pluginName) < 0) {
        try {
          plugin = require(pluginPath);
          _logger.log("Plugin loaded! Source: %s", pluginPath);
          if ("init" in plugin) {
            plugin.init(pluginName);
            _logger.log("Triggered init() for plugin");
          }
          if ("commands" in plugin) {
            plugin.commands.forEach(cmd => {
              try {
                if ("exec" in plugin[cmd]) {
                  PurrplingBot.addCommand(cmd, plugin[cmd]);
                  _logger.log("Registered command: %s", cmd);
                } else {
                  throw new Error("Command '%s' is invalid! Missing exec() function.", cmd);
                }
              } catch (err) {
                _logger.error("Can't register command: '%s'", cmd);
                _logger.error(err.stack);
                process.exit(12);
              }
              eventBus.emit("commandRegister", cmd);
            });
          }
          _logger.info("Initialization DONE!");
          plugins[pluginName] = plugin; //Add plugin to plugin registry
          eventBus.emit("pluginLoaded", plugin, pluginName);
        } catch (err) {
          _logger.error("Error while loading plugin! Source: %s", pluginPath);
          _logger.error(err.stack);
          process.exit(10); // PLUGIN FAILURE! Kill the bot
        }
      } else {
        logger.log("Plugin '%s' DISABLED - Skip loading", pluginName);
      }
    });
    eventBus.emit("pluginsLoaded", plugins);
    logger.info("*** Plugin loader process was SUCCESFULL!");
  } catch (err) {
    logger.error("Plugins can't be loaded!")
    logger.error(err);
    process.exit(8);
  }
}

exports.init = function() {
  logger = PurrplingBot.createLogger("PluginRegistry");
  if (CONFIG.pluginsDisabled && CONFIG.pluginsDisabled instanceof Array) {
    plugins_disabled = CONFIG.pluginsDisabled; // Fetch disabled plugins from config
  }
  load_plugins(PLUGIN_DIR);
}

exports.getPlugins = function () {
  return plugins;
}

exports.countPlugins = function() {
  return Object.keys(plugins).length
}

exports.getDisabledPlugins = function() {
  return plugins_disabled;
}

exports.countDisabledPlugins = function() {
  return Object.keys(plugins_disabled).length
}

if (require.main === module) {
  console.log("To start PurrplingBot please run purrplingbot.js instead.");
}
