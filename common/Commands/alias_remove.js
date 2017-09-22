/*
* BuiltIn Command !alias_remove
*/

var logger = require("../builtin").logger.derive("AliasRemove");

module.exports = {
  "description": "Remove an alias",
  "usage": "<aliasName>",
  "exec": function(message, tail) {
    var prefix = core.Commander.Prefix || "";
    var aliases = core.getAliases();
    if (!core.Configuration.admins || core.Configuration.admins.indexOf(message.author.username) < 0) {
      message.reply("You are not permitted for remove alias!")
      .catch(logger.error);
      logger.info(`User ${message.author.username} is not permitted for remove alias!`);
      return;
    }
    if (!tail) {
      message.reply("Invalid arguments.")
      .catch(logger.error);
      logger.info("Invalid parameters for remove an alias!");
      return;
    }
    if (tail in aliases) {
      delete aliases[tail];
      storeAliases();
      logger.info("Removed alias: %s", tail);
      message.reply(`Alias \`${prefix}${tail}\` removed!`)
      .then(logger.log(`Sent info about alias SUCCESS remove to #${message.channel.name}`))
      .catch(logger.error);
    } else {
      logger.info("Unknown alias: %s - Can't remove", tail);
      message.reply(`Alias \`${prefix}${tail}\` is not found! Can't remove.`)
      .then(logger.log(`Sent info about alias FAILED remove to #${message.channel.name}`))
      .catch(logger.error);
    }
  }
}
