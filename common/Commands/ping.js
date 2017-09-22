/*
 * BuiltIn Command !ping
 */

var logger = require("../builtin").logger.derive("Ping");

module.exports = {
  "description": "Ping the bot and get pong.",
  "exec": function(message) {
    message.reply("pong")
    .then(msg => logger.info(`Pong sent to ${msg.author.username} in #${msg.channel.name}`))
    .catch(logger.error);
  }
};
