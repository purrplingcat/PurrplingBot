/*
 * BuiltIn Command !plugins
 */

var logger = require("../builtin").logger.derive("Plugins");

module.exports = {
  "description": "Get list of loaded plugins",
  "usage": "[<pluginName>]",
  "exec": function(message, tail, core) {
    var plugins = core.getPluginRegistry().getPlugins();
    var plugins_disabled = core.getPluginRegistry().getDisabledPlugins();
    if (tail) {
      var plugin = plugins[tail];
      if (!plugin) {
        logger.info(`Plugin '${tail}' not exists or disabled!`);
        message.channel.send(`Plugin '${tail}' not exists or disabled!`);
        return;
      }
      var info = "Plugin: " + tail + "\n";
      var prefix = core.Commander.Prefix;
      info += "Registered commands: `" + (plugin.commands ? plugin.commands.map(el => {return prefix + el }).join(', ') : "no commands") + "`\n";
      var status = {};
      if (typeof(plugin.status) == "function") status = plugin.status();
      if (status) {
        for (var statKey in status) {
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
};
