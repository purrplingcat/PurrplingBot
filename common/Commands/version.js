/*
 * BuiltIn Command !version
 */

var logger = require("../builtin").logger.derive("Version");

module.exports = {
  "description": "core version and codename",
  "exec": function(message, tail, core) {
    message.channel.send("PurrplingBot version " + core.Version + " '" + core.Codename + "'")
    .then(logger.info(`Version info sent to ${message.author.username} in ${message.channel.name}`))
    .catch(logger.error);
  }
};
