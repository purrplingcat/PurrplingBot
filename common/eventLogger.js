const DEBUG = process.env.DEBUG || 0;
const EventEmiter = require('events');
const LOGGER = require("../lib/logger.js");
const LOGEVENT_KEY = "logevent";
const LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL"
};
const moment = require('moment');

var logger = LOGGER.createLogger("EventLogger");

class EventLogger extends EventEmiter {
  constructor(core, config) {
    super();
    if (!config) config = {};
    this.enabled = config.enabled || false;
    this.loggingChannelID = config.loggingChannelID;
    this.core = core;
    this.core.on('message', this._onMessage.bind(this));
  }

  logEvent(msg, type, level = LEVELS.INFO) {
    const enabled = this.enabled;
    const channelID = this.loggingChannelID;
    var client = this.core.DiscordClient;
    if (!enabled) {
      logger.log("Can't send log event - EventLogger is DISABLED!");
      return;
    }
    if (!channelID) {
      logger.error("Can't send log event - loggingChannelID is EMPTY!");
      return;
    }
    var channel = client.channels.find('id', channelID);
    if (!channel) {
      logger.log("Can't send log event - Unknown event logging channel: %s", channelID);
      return;
    }
    if (level == LEVELS.DEBUG && DEBUG < 1) return;
    if (level == LEVELS.ERROR || level == "FATAL" || level == LEVELS.WARN) {
      client.user.setStatus("dnd");
      client.user.setGame(`${type} - ${msg}`);
    }
    let timestamp = moment(new Date()).format("MM/DD HH:mm:ss");
    channel.send(`${timestamp}: _${level}_ - **${type}** - ${msg}`)
    .then(logger.info(`Event log ${type} - "${msg}" sent to #${channel.name} level: ${level}`
    + (level == LEVELS.ERROR ? " @here" : "")
    + (level == LEVELS.FATAL ? " BOT ABORT! @here" : "")))
    .catch(logger.error);
    if (level == LEVELS.FATAL) {
      logger.error("Bot runtime aborted, because logged FATAL event: %s", msg);
      process.exit(100);
    }
  }

  logDebug(msg, type) {
    this.logEvent(msg, type, LEVELS.DEBUG);
  }

  logWarn(msg, type) {
    this.logEvent(msg, type, LEVELS.WARN);
  }

  logError(msg, type) {
    this.logEvent(msg, type, LEVELS.ERROR);
  }

  logFatal(msg, type) {
    this.logEvent(msg, type, LEVELS.FATAL); // This aborts a bot!
  }

  watch(watchedObj, event = LOGEVENT_KEY) {
    if (!(watchedObj instanceof EventEmmiter)) throw Error("Watched object is not instance of EventLogger");
    watchedObj.on(event, this.logEvent.bind(this));
  }

  _onMessage(message) {
    var client = this.core.DiscordClient;
    if (this.enabled && message.author.id != client.user.id && message.channel.id == this.loggingChannelID) {
      client.user.setStatus("online");
      client.user.setGame(null);
      logger.info("User confirmed reading event logs!");
    }
  }
}

EventLogger.LOGEVENT_KEY = LOGEVENT_KEY;
EventLogger.LEVELS = LEVELS;
EventLogger.LOGGER = logger;

module.exports = EventLogger;
