const PurrplingBot = require("../../purrplingbot.js");
const SimpleGroupCommand = require("../../common/commands/simpleGroupCommand");
const durationParse = require("duration-parser");
const moment = require('moment');
var bot = PurrplingBot.getDiscordClient();
var store = PurrplingBot.getStore();
var config = PurrplingBot.getConfiguration();
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
  logger = PurrplingBot.createLogger(pluginName);
  try {
    restoreAnnounces();
    for (name in announces) {
      var announce = announces[name];
      if (announce.active) {
        resumeAnnounce(announce.name);
      }
    }
    repeater = new Repeater(announces, repeaterConf, PurrplingBot.createLogger(pluginName + ":Repeater"));
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
    "Runners": Object.keys(announceRunners).length,
    "Announces in queue for repeat": repeater.queue.length,
    "Spam protection enabled": announcerConf.antispam,
    "Repeater enabled": repeater.options.enabled
  }
}

PurrplingBot.on('message', function(message){
  if (message.author.id == bot.user.id) return;
  let antispam = announcerConf.antispam || true;
  if (antispam) {
    repeater.processQueue(message.channel);
  }
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
    PurrplingBot.logEvent(`Announce '${announce.name}' can't be handled! Channel '${name}' is UNKNOWN!'`, "Announce:Handle", "ERROR");
    return false;
  }
  if ((announcerConf.antispam || true) && _by == INTERVAL_TRIGGER && !announce.neverHandled) {
      var msgs = channel.messages.filterArray(function (msg) {
        var currentTime = new Date();
        var durationParser = require("duration-parser");
        return (currentTime.getTime() - msg.createdAt.getTime()) < durationParser(announcerConf.inactivity || "1h") && msg.author.id != bot.user.id;
      });
      let activeThres =  announcerConf.activityLinesThreshold || 1;
      if (msgs.length < activeThres) {
        logger.log("Can't handle announce %s - No activity in #%s", announce.name, channel.name);
        PurrplingBot.logEvent(`Announce '${announce.name}' not handled - Channel ${channel.name} is inactive! Adding to queue.`, "Announce:ChannelInactive");
        repeater.addToQueue(announce);
        return false;
      }
  }
  PurrplingBot.logEvent(`Handle announce '${announce.name}', Channel: ${channel.name}, HandledBy: ${_by}, NeverHandled: ${announce.neverHandled}`, "Announce:Handle");
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
    PurrplingBot.logEvent(`Canceled runner of announce '${announce.name}', NeverHandled: ${announce.neverHandled}`, "Announce:Cancel");
    logger.info(`Canceled runner of announce '${name}'`);
    return true;
  } catch(err) {
    logger.error("Can't cancel announce '%s' - FATAL ERROR", name);
    logger.error(err);
    return false;
  }
}

function resumeAnnounce(name, interval, neverHandledFlag = false) {
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
    if (neverHandledFlag) announce.neverHandled = true;
    PurrplingBot.logEvent(`Resumed announce '${announce.name}', Interval: ${announce.interval}, NeverHandled: ${announce.neverHandled}`, "Announce:Resume");
    logger.info(`Resumed announce: ${announce.name} (Interval: ${announce.interval})`);
    return announce;
  } catch (err) {
    logger.error(`Can't resume announce '${name}' - FATAL ERROR:`);
    logger.error(err);
    return {error: true, message: "Can't resume announce - " + err.toString()};
  }
}

function execAdd(cmdMessage) {
  if (cmdMessage.args.length < 4) {
    cmdMessage.reply("Invalid parameters!")
    .then(logger.info(`Invalid parameters for ADD User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  var name = cmdMessage.args.shift();
  var interval = cmdMessage.args.shift();
  var channel = cmdMessage.args.shift();
  var _message = cmdMessage.args.join(' ');
  if (announces[name]) {
    logger.info(`Announce '${name}' already exists! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`);
    cmdMessage.reply(`Can't add announce '${name}' - Announce already exists!`)
    .catch(logger.error);
    return;
  }
  if (!cmdMessage.guild.channels.find('id', utils.parseChannelID(channel))) {
    var _channel = cmdMessage.guild.channels.find('name', channel);
    if (_channel) {
      channel = _channel.id;
    } else {
      logger.info(`Invalid channel '${channel}' for announce! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`);
      cmdMessage.reply(`Invalid channel '${channel}' for announce!`)
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
  cmdMessage.channel.send(`Announce '${name}' added! Activate it by '!announce resume ${name}'`)
  .then(logger.info(`Announce '${name}' added! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}}`))
  .catch(logger.error);
}

function execResume(cmdMessage) {
  if (cmdMessage.args.length < 1) {
    cmdMessage.reply("Invalid arguments!")
    .then(logger.info(`Invalid arguments for resume announce! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  var name = cmdMessage.args[0];
  var interval = cmdMessage.args[1];
  var announce = resumeAnnounce(name, interval, true);
  if (!announce) {
    cmdMessage.reply(`Can't resume Announce '${name}' - Unknown error`)
    .catch(logger.error);
    return;
  }
  if (announce.error) {
    cmdMessage.reply(`${announce.cmdMessage}`)
    .catch(logger.error);
    return;
  }
  storeAnnounces();
  cmdMessage.channel.send(`Announce '${announce.name}' resumed with interval ${announce.interval}`)
  .then(logger.info(`Announce '${announce.name}' resumed with interval ${announce.interval}\t User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
  .catch(logger.error);
}

function execCancel(cmdMessage) {
  if (cmdMessage.args.length < 1) {
    cmdMessage.reply("Invalid arguments!")
    .then(logger.info(`Invalid arguments for cancel announce! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  var name = cmdMessage.args[0];
  var runner = announceRunners[name];
  if (!runner) {
    cmdMessage.reply(`Announce '${name}' not active and not running!`)
    .then(logger.info(`Announce '${name}' not active and not running! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  if (cancelAnnounce(name)) {
    storeAnnounces();
    cmdMessage.reply(`Announce '${name}' canceled!`)
    .catch(logger.error);
  } else {
    cmdMessage.reply(`Can't cancel announce '${name}'`)
    .catch(logger.error);
  }
}

function execList(cmdMessage) {
  if (!Object.keys(announces).length) {
    cmdMessage.channel.send(`Announces list is empty!`)
    .then(logger.info(`Announces list is empty! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  var announces_print = "";
  for (announceName in announces) {
    var announce = announces[announceName];
    announces_print += "Announce '" + announce.name + "' (" + announce.interval + ") in <#" + announce.channel + "> - " + (announce.active ? "ACTIVE" : "INACTIVE") + (announceRunners[announce.name] ? " [RUNNING]" : " [STOPPED]") + "\n";
  }
  cmdMessage.channel.send(announces_print)
  .then(logger.info(`Announces list sent! Announces count: ${Object.keys(announces).length}\t User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
  .catch(logger.error);
}

function execHandle(cmdMessage) {
  if (cmdMessage.args.length < 1) {
    cmdMessage.reply("Invalid arguments!")
    .then(logger.info(`Invalid arguments for handle announce! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  var name = cmdMessage.args[0];
  if (handleAnnounce(name, cmdMessage.caller.username)) {
    cmdMessage.reply(`Announce '${name}' handled!`)
    .catch(logger.error);
    return;
  }
  cmdMessage.reply(`Can't handle Announce '${name}'!`)
  .catch(logger.error);
}

function execRm(cmdMessage) {
  if (cmdMessage.args.length < 1) {
    cmdMessage.reply("Invalid arguments!")
    .then(logger.info(`Invalid arguments for remove announce! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  var name = cmdMessage.args[0];
  var runner = announceRunners[name];
  if (runner) {
    cancelAnnounce(name);
  }
  delete announces[name];
  storeAnnounces();
  cmdMessage.channel.send(`Announce '${name}'' removed!`)
  .then(logger.info(`Announce '${name}'' removed! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
  .catch(logger.error);
}

function execShow(cmdMessage) {
  if (cmdMessage.args.length < 1) {
    cmdMessage.reply("Invalid arguments!")
    .then(logger.info(`Invalid arguments for show announce! User: ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
    .catch(logger.error);
    return;
  }
  var name = cmdMessage.args[0];
  var announce = announces[name];
  if (!announce) {
    cmdMessage.reply(`Announce ${name} not exists!`)
    .then(logger.info("Can't show information about unexisted announce! Channel: #%s by %s", cmdMessage.channel.name, cmdMessage.caller.username))
    .catch(logger.error);
    return;
  }
  var announce_print = "Announce: " + announce.name 
      + "\nInterval: " + announce.interval 
      + "\nChannel: <#" + announce.channel + ">" 
      + "\nStatus: " + (announce.active ? "ACTIVE" : "INACTIVE") + (announceRunners[announce.name] ? " [RUNNING]" : " [STOPPED]")
      + "\nLast try: " + (announce.lastTry ? moment(announce.lastTry).format("DD.MM.YYYY HH:mm:ss") : "never")
      + "\nLast handle: " + (announce.lastHandle ? moment(announce.lastHandle).format("DD.MM.YYYY HH:mm:ss") : "never")
      + "\nIn repeater queue: " + (repeater.isInQueue(announce.name) ? "yes" : "no")
      + "\nMessage: " + announce.message;
  cmdMessage.channel.send(announce_print)
  .then(logger.log("Announce info '%s' sent to #%s requested by: %s", announce.name, cmdMessage.channel.name, cmdMessage.caller.username))
  .catch(logger.error);
}

function createAnnounceCommand() {
  var announceCmd = new SimpleGroupCommand(PurrplingBot.Commander)
    .setDescription("Control an Announcer")
    .setBotAdminOnly(true);
  announceCmd.createSubcommand("add", execAdd)
    .setDescription("Add an announcer. Interval examples: 10s, 5m, 1h25m, 1h45m30s.")
    .setUsage("<name> <interval> <channel> <message>");
  announceCmd.createSubcommand("rm", execRm)
    .setDescription("Remove an announce.")
    .setUsage("<name>");
  announceCmd.createSubcommand("list", execList)
    .setDescription("List announces");
  announceCmd.createSubcommand("resume", execResume)
    .setDescription("Resume an announcer to ACTIVE state and start the runner. Interval examples: 10s, 5m, 1h25m, 1h45m30s.")
    .setUsage("<name> [<interval>]");
  announceCmd.createSubcommand("cancel", execCancel)
    .setDescription("Cancel an announcer to INACTIVE atate and stop the runner.")
    .setUsage("<name>");
  announceCmd.createSubcommand("handle", execHandle)
    .setDescription("Manually handle an announce.")
    .setUsage("<name>");
  announceCmd.createSubcommand("show", execShow)
    .setDescription("Show announce information")
    .setUsage("<name>");
  return announceCmd;
}

exports.announce = createAnnounceCommand();
/*exports.announce = {
  "description": "Control an Announcer",
  "usage": "<add|rm|list|resume|cancel|handle|help> [options/args]",
  "exec": function(message, tail, authority) {
    if (!authority.BotAdmin) {
      message.reply("You are not permitted to use this command!")
      .then(logger.info(`User '${message.author.username}' has no permissions for command 'announce'!`))
      .catch(logger.error);
      return;
    }
    if (!tail.length || tail == null) {
      tail = "help";
    }
    var args = tail.split(" ");
    var scmd = args.shift();
    logger.log(`Handle subcommand: ${tail} on #${message.channel.name} by ${message.author.username}`);
    execSubCommand(scmd, args, message);
  }
}*/

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node PurrplingBot.js' instead.");
  process.exit(1);
}
