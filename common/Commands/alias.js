/*
* BuiltIn Command !alias
*/

const ALIASES_STORE = "aliases";

const UTILS = require("../../lib/utils");
var logger = require("../builtin").logger.derive("Alias");

function storeAliases(core) {
  var aliases = core.Commander.Aliases;
  core.Store.storeScope(ALIASES_STORE, aliases)
  .flush();
}

module.exports = {
  "description": "Create an alias or list aliases",
  "usage": "[<aliasName> <command>]",
  "exec": function(message, tail, core) {
    if (!tail.length) {
      var aliases = core.getAliases();
      message.channel.send("List of aliases: " + UTILS.formatAliasList(aliases))
      .then(logger.info(`Aliases list sent to #${message.channel.name} requested by: ${message.author.username}`))
      .catch(logger.error);
      return;
    }
    if (!core.Configuration.admins || core.Configuration.admins.indexOf(message.author.username) < 0) {
      message.reply("You are not permitted for add alias!")
      .catch(logger.error);
      logger.info(`User ${message.author.username} is not permitted for add alias!`);
      return;
    }
    var argv = tail.split(' ');
    var alias = argv.shift();
    var command = argv.join(' ');
    var prefix = core.Commander.Prefix || "";
    if (!alias || !command) {
      message.reply("Missing or wrong some parameters!")
      .catch(logger.error);
      logger.info("Missing or wrong parameters for command alias!");
      return;
    }
    // Remove prefix from aliasName
    if (alias.startsWith(prefix)) {
      alias = alias.substr(prefix.length);
    }
    // Remove prefix from aliased command
    if (command.startsWith(prefix)) {
      command = command.substr(prefix.length);
    }
    core.addAlias(alias, command);
    storeAliases(core);
    logger.log(`User ${message.author.username} created alias '${alias}' to '${command}' in #${message.channel.name}`);
    message.channel.send(`Alias \`${prefix}${alias}\` to \`${prefix}${command}\` created!`)
    .catch(logger.error);
  }
};
