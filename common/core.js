const EventEmmiter = require('events');
const LOGGER = require("../lib/logger.js");
const UTILS = require("../lib/utils.js");
const Commander = require("./commander");
const PluginRegistry = require("./pluginRegistry.js");
const Acl = require("./acl");
const BuiltinCommands = require("./builtin");
const Discord = require('discord.js');
const moment = require('moment');
const DEBUG = process.env.DEBUG || 0;
const PLUGIN_DIR = process.env.PLUGIN_DIR || process.cwd() + "/plugins";
const CMD_DIR = process.env.CMD_DIR || process.cwd() + "/common/Commands/";
const PKG = require("../package.json");

var logger = LOGGER.createLogger("Core");

class Core extends EventEmmiter {
  constructor(config, store) {
    super();

    this._client = new Discord.Client();
    this._config = config;
    this._store  = store;

    this._checkConf(); // Check configuration

    this._commander = new Commander(this, this._config.cmdPrefix);
    this._pluginRegistry = new PluginRegistry(this, PLUGIN_DIR);
    this._acl = new Acl(this, config.admins);

    this.stats = {
      commandsHandled: 0,
      numberOfReconnection: 0
    }

    this._client.on('ready', this._onReady.bind(this));
    this._client.on('message', this._onMessage.bind(this));
    this._client.on('messageUpdate', this._onMessageUpdate.bind(this));
    this._client.on('disconnect', this._onDisconnect.bind(this));
    this._client.on('debug', this._onDebug.bind(this));
    this._client.on('warn', this._onWarn.bind(this));
    this._client.on('reconecting', this._onReconecting.bind(this));
  }

  run(connect = true) {
    let config = this._config;

    // Register builtin commands
    BuiltinCommands.registerBuiltinCommands(this._commander, CMD_DIR);

    // Restore aliases
    this._commander.aliases = this._store.restoreScope("aliases");

    // Init plugins into plugin registry
    this._pluginRegistry.initPlugins();

    // Autosave enabled? Set interval for save storage
    const STORAGE_CONF = config.storage || {};
    if (STORAGE_CONF.autosave || true) {
      const INTERVAL = STORAGE_CONF.autosaveInterval || 90; // Interval in seconds
      this._client.setInterval(function (core) {
        if (DEBUG > 1) logger.log("Triggered store autosave interval!");
        core.Store.flush();
      }, INTERVAL * 1000, this);
      logger.info("Store autosave started! Interval: %ss", INTERVAL);
    }

    // Print a stats to log
    logger.info("* Registered commands: %s", Object.keys(this._commander.cmds).length);
    logger.info("* Loaded plugins: %s", this._pluginRegistry.countPlugins());
    logger.info("* Disabled plugins: %s", this._pluginRegistry.countDisabledPlugins());

     // Connect bot to Discord!
    if (connect) this.connectBot();
  }

  logEvent(msg, type = "Bot", level = "INFO") {
    const eventLoggerConf = this._config.eventLogger || {};
    const enabled = eventLoggerConf.enabled || false;
    const channelID = eventLoggerConf.loggingChannelID;
    if (!enabled) {
      logger.log("Can't send log event - EventLogger is DISABLED!");
      return;
    }
    if (!channelID) {
      logger.error("Can't send log event - loggingChannelID is EMPTY!");
      return;
    }
    var channel = this._client.channels.find('id', channelID);
    if (!channel) {
      logger.log("Can't send log event - Unknown event logging channel: %s", channelID);
      return;
    }
    if (level == "DEBUG" && DEBUG < 1) return;
    let timestamp = moment(new Date()).format("MM/DD HH:mm:ss");
    channel.send(`${timestamp}: _${level}_ - **${type}** - ${msg}`)
    .then(logger.info(`Event log ${type} - "${msg}" sent to #${channel.name} level: ${level}` + (level == "ERROR" ? " @here" : "")))
    .catch(logger.error);
  }

  /*
   * @deprecated
   */
  createLogger(scope) {
    return LOGGER.createLogger(scope);
  }

  connectBot() {
    logger.info("*** Trying to connect Discord");
    this._client.login(this._config.discord.token);
  }

  _checkConf() {
    let config = this._config;
    if (!config.discord) {
      logger.error("Discord scope not defined in config!");
      process.exit(6);
    }
    if (!config.discord.token) {
      logger.error("Token not defined in discord scope!");
      process.exit(6);
    }
    logger.log("Configuration check is OK!");
  }

  _onReady() {
    logger.info(`Logged in as ${this._client.user.username} - ${this._client.user.id} on ${this._client.guilds.array().length} servers`);
    this.stats.numberOfReconnection++;
    this.emit("ready");
    this.logEvent("PurrplingBot is ready and works!", "BotReady");
    logger.info("PurrplingBot READY!");
  }

  _onMessage(message) {
    var isCmd = this._commander.check_message_for_command(message); //check and handle cmd
    this.emit("message", message, isCmd);
  }

  _onMessageUpdate(oldMessage, newMessage) {
    var isCmd = this._commander.check_message_for_command(newMessage); //check and handle cmd
    this.emit("messageUpdate", oldMessage, newMessage, isCmd);
  }

  _onDisconnect(event) {
    logger.warn("PurrplingBot disconnected from Discord service!")
    logger.warn("Reason: #%s - %s", event.code, event.reason);
    logger.info("*** Exiting");
    process.exit(15);
  }

  _onDebug(info){
    if (DEBUG > 1) logger.log(info);
  }

  _onWarn(info){
    logger.warn(info);
  }

  _onReconecting() {
    logger.warn("Connection lost! Trying to reconnect ...");
  }

  get Store() {
    return this._store;
  }

  get Configuration() {
    return this._config;
  }

  get Commander() {
    return this._commander;
  }

  get DiscordClient() {
    return this._client;
  }

  get Acl() {
    return this._acl;
  }

  get Version() {
    return PKG.version;
  }

  get Codename() {
    return PKG.codename;
  }

  get ProductName() {
    return PKG.name
  }

  getPluginRegistry() {
    return this._pluginRegistry;
  }

  /*
   * @deprecated
   */
  getCommandRegistry() {
    return this._commander.cmds;
  }

  /*
   * @deprecated
   */
  getDiscordClient() {
    return this._client;
  }

  /*
   * @deprecated
   */
  getStats() {
    return this.stats;
  }

  /*
   * @deprecated
   */
  getAliases() {
    return this._commander.aliases;
  }

  /*
   * @deprecated
   */
  addCommand(cmdName, cmdObject) {
    this._commander.addCommand(cmdName, cmdObject);
  }

  /*
   * @deprecated
   */
  addAlias(aliasName, command) {
    this._commander.addAlias(aliasName, command);
  }

  /*
   * @deprecated
   */
  getConfiguration(){
    return this._config;
  }

  /*
   * @deprecated
   */
  getStore() {
    return this._store;
  }
}

module.exports = Core;

if (require.main === module) {
  console.log("To start PurrplingBot please run purrplingbot.js instead.");
}