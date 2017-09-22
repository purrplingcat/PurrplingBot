/*
 * BuiltIn Command !uptime
 */

var logger = require("../builtin").logger.derive("Uptime");

module.exports = {
  "description": "Get uptime of bot",
  "exec": function(message) {
    var bot = message.client;
    message.channel.send(`Uptime: ${moment(bot.readyAt).twix(new Date()).humanizeLength()} \nReady at: ${moment(bot.readyAt).format("DD.MM.YYYY HH:mm:ss")}`)
    .then(logger.info(`Uptime sent to #${message.channel.name} requested by: ${message.author.username}`))
    .catch(logger.error);
  }
}
