var PurrplingBot = require("../../purrplingbot.js");
var client = PurrplingBot.getDiscordClient();
const CONFIG = PurrplingBot.getConfiguration();
const TWITCHORD_CONFIG = CONFIG.twitchcord || {};

var logger;
var reconnectCount = 0;
const RECONNECT_LIMIT = TWITCHORD_CONFIG.reconnectLimit || 32;

var tmi = require("tmi.js");
var tmiClient = new tmi.client({
    identity: {
        username: TWITCHORD_CONFIG.username || "",
        password: TWITCHORD_CONFIG.password || ""
    },
    channels: [TWITCHORD_CONFIG.twitchChannel || "#test"],
});

tmiClient.on("connected", function (address, port) {
    reconnectCount = 0;
    logger.log("Twitch chat client state: %s", tmiClient.readyState());
});

tmiClient.on("connecting", function (address, port) {
    logger.log("Twitch chat client state: %s", tmiClient.readyState());
});

tmiClient.on("disconnected", function (reason) {
    logger.warn("Twitch chat DISCONNECTED! Reason: %s", reason);
    logger.log("Twitch chat client state: %s", tmiClient.readyState());
    if (reconnectCount < RECONNECT_LIMIT) {
      logger.info("Trying to reconnect. Count: %s Limit: %s", reconnectCount, RECONNECT_LIMIT);
      reconnectCount++;
      tmiClient.connect();
    } else {
      logger.warn("*** Can't be reconnected - Reconnect limit exceeded! Please restart bot. Limit: %s", RECONNECT_LIMIT);
    }
});

tmiClient.on("chat", function (channel, userstate, message, self) {
    // Don't listen to my own messages..
    //if (self) return;
    logger.info("[TWITCH -> DISCORD] Forwarding message: %s", message);
    var channel = client.channels.find('id', TWITCHORD_CONFIG.discordChannelId || "");
    if (!channel) {
      logger.error("Can't forward message to Discord! Channel not found!");
      return;
    }
    channel.send(`<${userstate.username}> ${message}`)
    .then(logger.log("Message forwarded to: #%s", channel.name))
    .catch(logger.error);
});

PurrplingBot.on("message", function(message, isCmd) {
  if (message.author.id === client.user.id) return;
  if (isCmd) return;
  if (message.channel.id == TWITCHORD_CONFIG.discordChannelId || "") {
    logger.info("[DISCORD -> TWITCH] Forwarding message: <%s> %s", message.author.username, message.content);
    tmiClient.say(TWITCHORD_CONFIG.twitchChannel || "#test", `<${message.author.username}> ${message.content}`);
  }
});

PurrplingBot.on("ready", function() {
  logger.log("PurrplingBot is ready to attempt to connect with TwitchChat (IRC protocol)");
  tmiClient.connect();
});

function init(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  tmiClient.log = logger; // Setup PurrplingBot's logger to tmiClient
  logger.log("Twitch chat client state: %s", tmiClient.readyState());
}

exports.init = init;

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
