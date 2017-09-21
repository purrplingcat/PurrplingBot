var PurrplingBot = require("./core");

const CONFIG = PurrplingBot.getConfiguration();
const PLUGIN_DIR = process.env.PLUGIN_DIR || process.cwd() + "/plugins";
const DEBUG = process.env.DEBUG || 0;

var plugins = {}; // { pluginName: plugin, ...}
var pluginList = {}; // { pluginName: pluginPath, ... }
var plugins_disabled = [];
var logger;

function preload_plugins(pluginDir) {
  const fs = require("fs");
  const path = require("path");
  var _pluginList = {};
  logger.log("Prealoading plugins ...");
  fs.readdirSync(pluginDir)
  .filter(file => fs.lstatSync(path.join(pluginDir, file)).isDirectory())
  .forEach(pluginName => {
    logger.log("Preloading plugin: %s", pluginName);
    const pluginPath = pluginDir + "/" + pluginName + "/" + pluginName.toLowerCase() + ".js";
    if (plugins_disabled.indexOf(pluginName) < 0) {
      if (fs.existsSync(pluginPath)) {
        logger.log("Found plugin entry file: %s", pluginPath);
        // TODO: Write NPM install denepdencies (issue #22)
        _pluginList[pluginName] = pluginPath;
        PurrplingBot.emit("pluginPreloaded", pluginName, pluginPath);
        logger.info("Enabled plugin: %s", pluginName);
      } else {
        plugins_disabled.push(pluginName);
        logger.error("Plugin '%s' is not valid! Entry file '%s' not found - Plugin DISABLED!", pluginName, pluginPath);
      }
    } else {
      logger.log("Plugin '%s' DISABLED - Skip loading", pluginName);
    }
  });
  if (DEBUG > 2) logger.dir(_pluginList);
  return _pluginList;
}

function load_plugins(pluginList) {
  try {
    logger.log("Loading plugins ...");

    if (plugins_disabled.length) {
      logger.info("Disabled plugins: %s", plugins_disabled);
    }
    for (pluginName in pluginList) {
      logger.info("Trying to load plugin: %s", pluginName);
      const pluginPath = pluginList[pluginName];
      plugins[pluginName] = init_plugin(pluginName, pluginPath); // Init plugin and add it to plugin registry
      PurrplingBot.emit("pluginLoaded", plugin, pluginName);
    }
    PurrplingBot.emit("pluginsLoaded", plugins);
    logger.info("*** Plugin loader process was SUCCESFULL!");
  } catch (err) {
    logger.error("Plugins can't be loaded!")
    logger.error(err);
    process.exit(8);
  }
}

function init_plugin(pluginName, pluginPath) {
  // Create internal logger for different plugin loader process
  var _logger = PurrplingBot.createLogger(pluginName);
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
        PurrplingBot.emit("commandRegister", cmd);
      });
    }
    _logger.info("Initialization DONE!");
    return plugin;
  } catch (err) {
    _logger.error("Error while loading plugin! Source: %s", pluginPath);
    _logger.error(err.stack);
    process.exit(10); // PLUGIN FAILURE! Kill the bot
  }
}

exports.init = function() {
  logger = PurrplingBot.createLogger("PluginRegistry");
  logger.info("*** Plugin loader process started!");
  if (CONFIG.pluginsDisabled && CONFIG.pluginsDisabled instanceof Array) {
    plugins_disabled = CONFIG.pluginsDisabled; // Fetch disabled plugins from config
  }
  pluginList = preload_plugins(PLUGIN_DIR);
  if (DEBUG > 2) logger.dir(plugins_disabled)
  load_plugins(pluginList);
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
