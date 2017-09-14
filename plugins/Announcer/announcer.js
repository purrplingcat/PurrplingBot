var purrplingBot = require("../../purrplingbot.js");
var durationParse = require("duration-parser");
var bot = purrplingBot.getDiscordClient();
var store = purrplingBot.getStore();
var config = purrplingBot.getConfiguration();
const Repeater = require("./repeater.js");

const utils = require("./utils.js");
const ANNOUNCES_STORE = "announces";
const INTERVAL_TRIGGER = "@Interval";
const REPEATER_TRIGGER = "@Repeater";

var logger;
var repeater;
var announces = {};
var announceRunners = {};
var announcerConf = config.announcer || {};
var repeaterConf = announcerConf.repeater || {};

exports.commands = [
  "announce"
];

exports.init = function(pluginName) {
  logger = purrplingBot.createLogger(pluginName);
  try {
    restoreAnnounces();
    for (name in announces) {
      var announce = announces[name];
      announce.neverHandled = true; // Mark announce as never handled at bot starts
      if (announce.active) {
        resumeAnnounce(announce.name);
      }
    }
    repeater = new Repeater(announces, repeaterConf, purrplingBot.createLogger(pluginName + ":Repeater"));
    repeater.on('repeat', function(announce){
      if ((announcerConf.antispam || true))
        handleAnnounce(announce.name, REPEATER_TRIGGER);
    });
  } catch (err) {
    logger.error("An error occured while resuming announces!")
    logger.error(err);
  }
}

exports.status = function() {
  return {
    "Announces": Object.keys(announces).length,
    "Runners": Object.keys(announces).length,
    "Announces in queue for repeat": repeater.queue.length,
    "Spam protection enabled": announcerConf.antispam,
    "Repeater enabled": repeater.options.enabled
  }
}

purrplingBot.on('message', function(message){
  if (message.author.id == bot.user.id) return;
  if ((announcerConf.antispam || true))
    repeater.processQueue();
});

function storeAnnounces() {
  logger.info("Store announces to data storage");
  store.storeScope(ANNOUNCES_STORE, announces)
  .flush();
}

function restoreAnnounces() {
  logger.info("Restore announces from data storage");
  announces = store.restoreScope(ANNOUNCES_STORE);
}

function handleAnnounce(name, _by) {
  var announce = announces[name];
  if (!announce) {
    logger.warn("Can't handle announce %s - Unexisted announce", name);
    return false;
  }
  announce.lastTry = new Date();
  var channel = bot.channels.find('id', announce.channel);
  if (!channel) {
    logger.warn("Can't handle announce %s - Unknown channel", name);
    return false;
  }
  if ((announcerConf.antispam || true) && _by == INTERVAL_TRIGGER && !announce.neverHandled) {
      var msgs = channel.messages.filterArray(function (msg) {
        var currentTime = new Date();
        var durationParser = require("duration-parser");
        return (currentTime.getTime() - msg.createdAt.getTime()) < durationParser(announcerConf.inactivity || "1h") && msg.author.id != bot.user.id;
      });
      if (msgs.length < announcerConf.activityLinesThreshold || 1) {
        logger.log("Can't handle announce %s - No activity in #%s", announce.name, channel.name);
        repeater.addToQueue(announce);
        return false;
      }
  }
  announce.neverHandled = false;
  announce.lastHandle = new Date();
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
    logger.info(`Announce '${name}' not exists - Can't resume!`);
    return {error: true, message: `Announce '${name} not exists - Can't resume!`};
  }
  if (announceRunners[name]) {
    logger.info("Announce '%s' already resumed and running!", name);
    return {error: true, message: `Announce '${name}' already resumed and running!`};
  }
  if (interval) {
    announce.interval = interval;
  }
  try {
    var duration;
    try {
      duration = durationParse(announce.interval);
    } catch (err) {
      logger.error("Can't resume announce - Invalid duration format: " + announce.interval);
      logger.log(err);
      return {error: true, message: "Can't resume announce - Invalid duration format: " + announce.interval};
    }
    var runner = bot.setInterval(handleAnnounce, duration, name, INTERVAL_TRIGGER);
    announceRunners[name] = runner;
    announce.active = true;
    announce.neverHandled = true;
    logger.info(`Resumed announce: ${announce.name} (Interval: ${announce.interval})`);
    storeAnnounces();
    return announce;
  } catch (err) {
    logger.error(`Can't resume announce '${name}' - FATAL ERROR:`);
    logger.error(err);
    return {error: true, message: "Can't resume announce - " + err.toString()};
  }
}

function execSubCommand(scmd, args, message) {
  switch (scmd) {
    case 'add':
      if (args.length < 4) {
        message.reply("Invalid parameters!")
        .then(logger.info(`Invalid parameters for ADD User: ${message.author.username} in #${message.channel.name}`))
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
        "active": false,
        "neverHandled": true
      };
      storeAnnounces();
      message.channel.send(`Announce '${name}' added! Activate it by '!announce resume ${name}'`)
      .then(logger.info(`Announce '${name}' added! User: ${message.author.username} in #${message.channel.name}}`))
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
      .then(logger.info(`Announce '${name}'' removed! User: ${message.author.username} in #${message.channel.name}`))
      .catch(logger.error);
    break;
    case 'list':
      if (!Object.keys(announces).length) {
        message.channel.send(`Announces list is empty!`)
        .then(logger.info(`Announces list is empty! User: ${message.author.username} in #${message.channel.name}`))
        .catch(logger.error);
        return;
      }
      var announces_print = "";
      for (announceName in announces) {
        var announce = announces[announceName];
        announces_print += "Announce '" + announce.name + "' (" + announce.interval + ") in <#" + announce.channel + "> - " + (announce.active ? "ACTIVE" : "INACTIVE") + (announceRunners[announce.name] ? " [RUNNING]" : " [STOPPED]") + "\n";
      }
      message.channel.send(announces_print)
      .then(logger.info(`Announces list sent! Announces count: ${Object.keys(announces).length}\t User: ${message.author.username} in #${message.channel.name}`))
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
        message.reply(`Announce '${name}' not active and not running!`)
        .then(logger.info(`Announce '${name}' not active and not running! User: ${message.author.username} in #${message.channel.name}`))
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
        message.reply(`Can't resume Announce '${name}' - Unknown error`)
        .catch(logger.error);
        return;
      }
      if (announce.error) {
        message.reply(`${announce.message}`)
        .catch(logger.error);
        return;
      }
      message.channel.send(`Announce '${announce.name}' resumed with interval ${announce.interval}`)
      .then(logger.info(`Announce '${announce.name}' resumed with interval ${announce.interval}\t User: ${message.author.username} in #${message.channel.name}`))
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
      + "`add <name> <interval> <channel> <message>` - Add an announcer. Interval examples: 10s, 5m, 1h25m, 1h45m30s.\n"
      + "`rm <name>` - Remove an announcer\n"
      + "`list` - List announces\n"
      + "`resume <name> [<interval>]` - Resume an announcer to ACTIVE state and start the runner. Interval examples: 10s, 5m, 1h25m, 1h45m30s.\n"
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
      .then(logger.info(`Unknown announcer subcommand: ${scmd}`))
      .catch(logger.error);
  }
}

exports.announce = {
  "description": "Control an Announcer",
  "usage": "<add|rm|list|resume|cancel|handle|help> [options/args]",
  "exec": function(message, tail) {
    if ("admins" in config) {
      if (config.admins.indexOf(message.author.username) > -1) {
        if (!tail.length || tail == null) {
          tail = "help";
        }
        var args = tail.split(" ");
        var scmd = args.shift();
        logger.log(`Handle subcommand: ${tail} on #${message.channel.name} by ${message.author.username}`);
        execSubCommand(scmd, args, message);
      } else {
        message.reply("You are not permitted to use this command!")
        .then(logger.info(`User '${message.author.username}' has no permissions for command 'announce'!`))
        .catch(logger.error);
      }
    } else {
      logger.warn("Node 'admins' is not defined in configuration!");
    }
  }
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
