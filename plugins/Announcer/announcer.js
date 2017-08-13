var purrplingBot = require("../../purrplingbot.js");
var bot = purrplingBot.getDiscordClient();
var config = require("../../config.json");

const utils = require("./utils.js");
const ANNOUNCES_STORE = "./announces.json";

var logger;
var announces = {};
var announceRunners = {};

exports.commands = [
  "announce"
];

exports.init = function(pluginName) {
  logger = purrplingBot.createLogger(pluginName);
  try {
    restoreAnnounces();
    for (name in announces) {
      var announce = announces[name];
      if (announce.active) {
        resumeAnnounce(announce.name);
      }
    }
  } catch (err) {
    logger.error("An error occured while resuming announces!")
    logger.error(err);
  }
}

function storeAnnounces() {
  fs = require('fs');
  var json = JSON.stringify(announces);
  fs.writeFile(ANNOUNCES_STORE, json, 'utf8', err => {
    if (err) {
      logger.error("An error occured while storing announces!");
      logger.error(err);
    } else {
      logger.log("Announces was stored!");
    }
  });
}

function restoreAnnounces() {
  fs = require('fs');
  try {
    var json = fs.readFileSync(ANNOUNCES_STORE, 'utf8').toString();
    announces = JSON.parse(json);
    logger.info("Announces restored!");
  } catch (err) {
    logger.warn("Can't restore announces list: %s", err);
  }
}

/* TODO: Only base test. Write a complete logic for:
 * [DONE] Trig a timer function for announce
 * [DONE] Add new announce by command !announce add <name> <interval> <#channel> <message>
 * [DONE] Store announces after add
 * [DONE] List announces by !announce List
 * Cancel announce by !announce cancel name
 * [DONE] Resume announce by !announce resume <name> [<interval>]
 * [DONE] Remove announce by !announce rm <name>
 * [DONE] Restore announces after start the bot
 * [DONE] Handle a command manualy by user
 *
 * Privileges: to !announce command can access only admins!
 */
function handleAnnounce(name, _by) {
  var announce = announces[name];
  if (!announce) {
    logger.warn("Can't handle announce %s - Unexisted announce", name);
    return false;
  }
  var channel = bot.channels.find('id', announce.channel);
  if (!channel) {
    logger.warn("Can't handle announce %s - Unknown channel", name);
    return false;
  }
  channel.send(announce.message)
  .then(logger.info(`Handled announce: ${announce.name} by: ${_by}`));
  return true;
}

function cancelAnnounce(name) {
  try {
    var runner = announceRunners[name];
    bot.clearInterval(runner);
    delete announceRunners[name];
    if (!announces[name]) {
      logger.warn("Announce '%s' not exists!", name);
    } else {
      announces[name].active = false;
    }
    storeAnnounces();
    return true;
  logger.info(`Canceled runner of announce '${name}'`);
  } catch(err) {
    logger.error("Can't cancel announce '%s' - FATAL ERROR", name);
    logger.error(err);
    return false;
  }
}

function resumeAnnounce(name, interval) {
  var announce = announces[name];
  if (!announce) {
    logger.log(`Announce '${name} not exists - Can't resume!`);
    return;
  }
  if (interval) {
    announce.interval = interval;
  }
  try {
    var runner = bot.setInterval(handleAnnounce, announce.interval * 1000, name, "@IntervalTrigger");
    announceRunners[name] = runner;
    announce.active = true;
    logger.info(`Resumed announce: ${announce.name} (Interval: ${announce.interval} seconds)`);
    storeAnnounces();
    return announce;
  } catch (err) {
    logger.error(`Can't resume announce '${name}' - FATAL ERROR:`);
    logger.error(err);
  }
}

function execSubCommand(scmd, args, message) {
  switch (scmd) {
    case 'add':
      if (args.length < 4) {
        message.reply("Invalid parameters!")
        .then(logger.log(`Invalid parameters for ADD User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      var name = args.shift();
      var interval = args.shift();
      var channel = args.shift();
      var _message = args.join(' ');
      if (announces[name]) {
        logger.info(`Announce '${name}' already exists! User: ${message.author.username} in #${message.channel.name}`);
        message.reply(`Can't add announce '${name}' - Announce already exists!`)
        .catch(logger.error);
        return;
      }
      if (!message.guild.channels.find('id', utils.parseChannelID(channel))) {
        var _channel = message.guild.channels.find('name', channel);
        if (_channel) {
          channel = _channel.id;
        } else {
          logger.info(`Invalid channel '${channel}' for announce! User: ${message.author.username} in #${message.channel.name}`);
          message.reply(`Invalid channel '${channel}' for announce!`)
          .catch(logger.error);
          return;
        }
      }
      announces[name] = {
        "name": name,
        "interval": interval,
        "channel": utils.parseChannelID(channel),
        "message": _message,
        "active": false
      };
      storeAnnounces();
      message.channel.send(`Announce ${name} with interval ${interval} seconds to channel <#${channel}> added! Activate it by '!announce resume ${name}'`)
      .then(logger.log(`Announce ${name} with interval ${interval} to channel <#${channel}> added! User: ${message.author.username} in #${message.channel.name}}`))
      .catch(logger.error);
    break;
    case 'rm':
      if (args.length < 1) {
        message.reply("Invalid arguments!")
        .then(logger.info(`Invalid arguments for remove announce! User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      var name = args[0];
      var runner = announceRunners[name];
      if (runner) {
        cancelAnnounce(name);
      }
      delete announces[name];
      storeAnnounces();
      message.channel.send(`Announce '${name}'' removed!`)
      .then(logger.log(`Announce '${name}'' removed! User: ${message.author.username} in #${message.channel.name}`))
      .catch(logger.error);
    break;
    case 'list':
      if (!Object.keys(announces).length) {
        message.channel.send(`Announces list is empty!`)
        .then(logger.log(`Announces list is empty! User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      var announces_print = "";
      for (announceName in announces) {
        var announce = announces[announceName];
        announces_print += "Announce '" + announce.name + "' (" + announce.interval + " seconds) in <#" + announce.channel + "> - " + (announce.active ? "ACTIVE" : "INACTIVE") + (announceRunners[announce.name] ? " [RUNNING]" : " [STOPPED]") + "\n";
      }
      message.channel.send(announces_print)
      .then(logger.log(`Announces list sent! Announces count: ${Object.keys(announces).length}\t User: ${message.author.username} in #${message.channel.name}`))
      .catch(logger.error);
    break;
    case 'cancel':
      if (args.length < 1) {
        message.reply("Invalid arguments!")
        .then(logger.info(`Invalid arguments for cancel announce! User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      var name = args[0];
      var runner = announceRunners[name];
      if (!runner) {
        message.reply(`Announce '${name} not active and not running!'`)
        .then(logger.info(`Announce '${name} not active and not running! User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      if (cancelAnnounce(name)) {
        message.reply(`Announce '${name} canceled!'`)
        .catch(logger.error);
      } else {
        message.reply(`Can't cancel announce '${name}'`)
        .catch(logger.error);
      }
    break;
    case 'resume':
      if (args.length < 1) {
        message.reply("Invalid arguments!")
        .then(logger.info(`Invalid arguments for resume announce! User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      var name = args[0];
      var interval = args[1];
      var announce = resumeAnnounce(name, interval);
      if (!announce) {
        message.reply(`Can't resume Announce '${name}'`)
        .catch(logger.error);
        return;
      }
      message.channel.send(`Announce '${announce.name}' resumed with interval ${announce.interval} seconds`)
      .then(logger.log(`Announce '${announce.name}' resumed with interval ${announce.interval} seconds\t User: ${message.author.username} in #${message.channel.name}`))
      .catch(logger.error);
    break;
    case 'handle':
      if (args.length < 1) {
        message.reply("Invalid arguments!")
        .then(logger.info(`Invalid arguments for handle announce! User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      var name = args[0];
      if (handleAnnounce(name, message.author.username)) {
        message.reply(`Announce '${name}' handled!`)
        .catch(logger.error);
        return;
      }
      message.reply(`Can't handle Announce '${name}'!`)
      .catch(logger.error);
    break;
    case 'help':
      var help_text = "Availaible subcomands: \n\n"
      + "`add <name> <interval> <channel> <message>` - Add an announcer. Interval is in seconds.\n"
      + "`rm <name>` - Remove an announcer\n"
      + "`list` - List announces\n"
      + "`resume <name> [<interval>]` - Resume an announcer to ACTIVE state and start the runner. Interval is in seconds.\n"
      + "`cancel <name>` - Cancel an announcer to INACTIVE atate and stop the runner.\n"
      + "`handle <name>` - Manually handle an announcer.\n"
      + "`help` - This help message\n";
      message.channel.send(help_text)
      .then(logger.log(`Announces help sent! User: ${message.author.username} in #${message.channel.name}`))
      .catch(logger.error);
      return;
    break;
    default:
      message.reply(`Unknown announcer subcommand: ${scmd}`)
      .then(logger.log(`Unknown announcer subcommand: ${scmd}`))
      .catch(logger.error);
  }
}

exports.announce = {
  "description": "Control an Announcer",
  "usage": "<add|rm|list|resume|cancel|handle|help> [options/args]",
  "exec": function(message, tail) {
    if (!tail.length || tail == null) {
      tail = "help";
    }
    var args = tail.split(" ");
    var scmd = args.shift();
    logger.log(`Handle subcommand: ${tail} on #${message.channel.name} by ${message.author.username}`);
    execSubCommand(scmd, args, message);
  }
}
