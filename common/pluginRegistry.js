const LOGGER = require("../lib/logger");
const DEBUG = require("./util/constants").DEBUG;

var logger = LOGGER.createLogger("PluginRegistry");

class PluginRegistry {
  constructor(core, pluginDir) {
    this.plugins = {}; // { pluginName: plugin, ...}
    this.pluginList = {}; // { pluginName: pluginPath, ... }
    this.plugins_disabled = [];
    this.pluginDir = pluginDir;
    this.core = core;
  }

  initPlugins(pluginDir) {
    logger.info("*** Plugin loader process started!");
    let config = this.core.Configuration;
    if (config.pluginsDisabled && config.pluginsDisabled instanceof Array) {
      this.plugins_disabled = config.pluginsDisabled; // Fetch disabled plugins from config
    }
    this.pluginList = this._preloadPlugins(this.pluginDir);
    if (DEBUG > 2) logger.dir(this.plugins_disabled)
    this._loadPlugins(this.pluginList);
    return this.plugins;
  }

  initPlugin(pluginName, pluginPath) {
    // Create internal logger for different plugin loader process
    var _logger = LOGGER.createLogger(pluginName);
    try {
      var plugin = require(pluginPath);
      _logger.log("Plugin loaded! Source: %s", pluginPath);
      if ("init" in plugin) {
        plugin.init(pluginName, this.core);
        _logger.log("Triggered init() for plugin");
      }
      if ("commands" in plugin) {
        plugin.commands.forEach(cmd => {
          try {
            if ("exec" in plugin[cmd]) {
              this.core.Commander.addCommand(cmd, plugin[cmd]);
              _logger.log("Registered command: %s", cmd);
            } else {
              throw new Error("Command '%s' is invalid! Missing exec() function.", cmd);
            }
          } catch (err) {
            _logger.error("Can't register command: '%s'", cmd);
            _logger.error(err.stack);
            process.exit(12);
          }
          this.core.emit("commandRegister", cmd);
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

  _preloadPlugins(pluginDir) {
    const fs = require("fs");
    const path = require("path");
    var _pluginList = {};
    logger.log("Prealoading plugins ...");
    fs.readdirSync(pluginDir)
    .filter(file => fs.lstatSync(path.join(pluginDir, file)).isDirectory())
    .forEach(pluginName => {
      logger.log("Preloading plugin: %s", pluginName);
      const pluginPath = pluginDir + "/" + pluginName + "/" + pluginName.toLowerCase() + ".js";
      if (this.plugins_disabled.indexOf(pluginName) < 0) {
        if (fs.existsSync(pluginPath)) {
          logger.log("Found plugin entry file: %s", pluginPath);
          // TODO: Write NPM install denepdencies (issue #22)
          _pluginList[pluginName] = pluginPath;
          this.core.emit("pluginPreloaded", pluginName, pluginPath);
          logger.info("Enabled plugin: %s", pluginName);
        } else {
          this.plugins_disabled.push(pluginName);
          logger.error("Plugin '%s' is not valid! Entry file '%s' not found - Plugin DISABLED!", pluginName, pluginPath);
        }
      } else {
        logger.log("Plugin '%s' DISABLED - Skip loading", pluginName);
      }
    });
    if (DEBUG > 2) logger.dir(_pluginList);
    return _pluginList;
  }

  _loadPlugins(pluginList) {
    try {
      logger.log("Loading plugins ...");

      if (this.plugins_disabled.length) {
        logger.info("Disabled plugins: %s", this.plugins_disabled);
      }
      for (var pluginName in pluginList) {
        logger.info("Trying to load plugin: %s", pluginName);
        const pluginPath = pluginList[pluginName];
        var plugin = this.plugins[pluginName] = this.initPlugin(pluginName, pluginPath); // Init plugin and add it to plugin registry
        this.core.emit("pluginLoaded", plugin, pluginName);
      }
      this.core.emit("pluginsLoaded", this.plugins);
      logger.info("*** Plugin loader process was SUCCESFULL!");
    } catch (err) {
      logger.error("Plugins can't be loaded!")
      logger.error(err);
      process.exit(8);
    }
  }

  get Plugins() {
    return this.plugins;
  }

  /*
   * @deprecated
   */
  getPlugins() {
    return this.plugins;
  }

  countPlugins() {
    return Object.keys(this.plugins).length
  }

  get DisabledPlugins() {
    return this.plugins_disabled;
  }

  /*
   * @deprecated
   */
  getDisabledPlugins() {
    return this.plugins_disabled;
  }

  countDisabledPlugins() {
    return Object.keys(this.plugins_disabled).length
  }
}

module.exports = PluginRegistry;

if (require.main === module) {
  console.log("To start PurrplingBot please run purrplingbot.js instead.");
}
