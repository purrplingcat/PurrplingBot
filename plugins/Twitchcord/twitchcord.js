var PurrplingBot = require("../../purrplingbot.js");
var client = PurrplingBot.getDiscordClient();
const CONFIG = PurrplingBot.getConfiguration();
const TWITCHORD_CONFIG = CONFIG.twitchcord || {};

var logger;
var hostingChannel;

var tmi = require("tmi.js");
var tmiClient = new tmi.client({
    identity: {
        username: TWITCHORD_CONFIG.username || "",
        password: TWITCHORD_CONFIG.password || ""
    },
    channels: [TWITCHORD_CONFIG.twitchChannel || "#test"],
    connection: {
      reconnect: true
    }
});

tmiClient.on("connected", function (address, port) {
    PurrplingBot.logEvent("Bot connected to Twitch chat. Joined: " + TWITCHORD_CONFIG.twitchChannel || "#test", "Twitchcord:READY");
    logger.log("Twitch chat client state: %s", tmiClient.readyState());
});

tmiClient.on("connecting", function (address, port) {
    logger.log("Twitch chat client state: %s", tmiClient.readyState());
});

tmiClient.on("disconnected", function (reason) {
    logger.warn("Twitch chat DISCONNECTED! Reason: %s", reason);
    PurrplingBot.logEvent("Twitch chat DISCONNECTED! Reason:" + reason, "Twitchcord:DISCONNECT", "ERROR");
    logger.log("Twitch chat client state: %s", tmiClient.readyState());
});

tmiClient.on("ping", function () {
    logger.log("Send PING to IRC server.");
});

tmiClient.on("pong", function (latency) {
    logger.log("Recieved PING from IRC server. Latency: %s", latency);
});

tmiClient.on("chat", function (channel, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;
    logger.log("[TWITCH -> DISCORD] Forwarding message ...");
    var channel = client.channels.find('id', TWITCHORD_CONFIG.discordChannelId || "");
    if (!channel) {
      logger.error("[TWITCH -> DISCORD] Can't forward message to Discord! Channel not found!");
      return;
    }
    channel.send(`<${userstate.username}> ${message}`)
    .then(logger.info("[TWITCH -> DISCORD] Message forwarded to: #%s", channel.name))
    .catch(logger.error);
});

tmiClient.on("hosting", function (source, target, viewers) {
  var channel = client.channels.find('id', TWITCHORD_CONFIG.discordChannelId || "");
  if (!channel) {
    logger.error("[TWITCH -> DISCORD] Can't send info about hosting. Channel not found!");
    return;
  }
  if (hostingChannel == target) {
    logger.info("[TWITCH -> DISCORD] Info about hosting '%s' already sent!", target);
    return;
  }
  hostingChannel = target;
  channel.send(`*Channel ${source} now hosting ${target} - <https://www.twitch.tv/${target}>*`)
  .then(logger.info("[TWITCH -> DISCORD] Message about hosting '%s' forwarded to: #%s", target, channel.name))
  .catch(logger.error);
});

tmiClient.on("unhost", function (channel, viewers) {
  var channel = client.channels.find('id', TWITCHORD_CONFIG.discordChannelId || "");
  if (!channel) {
    logger.error("[TWITCH -> DISCORD] Can't send info about hosting. Channel not found!");
    return;
  }
  channel.send(`*Channel ${source} ends hosting ${hostingChannel}*`)
  .then(logger.info("[TWITCH -> DISCORD] Message about stop hosting '%s' forwarded to: #%s", hostingChannel, channel.name))
  .catch(logger.error);
  hostingChannel = null;
});

PurrplingBot.on("message", function(message, isCmd) {
  if (message.author.id === client.user.id) return;
  if (isCmd) return;
  if (message.channel.id == TWITCHORD_CONFIG.discordChannelId || "") {
    logger.log("[DISCORD -> TWITCH] Forwarding message ...");
    tmiClient.say(TWITCHORD_CONFIG.twitchChannel || "#test", `<${message.author.username}> ${translateDiscordMentions(message)}`)
      .then(logger.info("[DISCORD -> TWITCH] Message forwarded to: %s", TWITCHORD_CONFIG.twitchChannel || "#test"))
      .catch(logger.error);
  }
});

PurrplingBot.on("ready", function() {
  logger.log("PurrplingBot is ready to attempt to connect with TwitchChat (IRC protocol)");
  if (tmiClient.readyState() != "OPEN") tmiClient.connect();
  else logger.info("IRC socket was already open!");
});

function init(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  tmiClient.log = logger; // Setup PurrplingBot's logger to tmiClient
  logger.log("Twitch chat client state: %s", tmiClient.readyState());
}

function translateDiscordMentions(message) {
  const mentionPattern = /<(@&|@!|@|#|)(\d+)>/g;
  var content = message.content; // Save content for translating
  while ((m = mentionPattern.exec(message.content)) !== null) {
    var [full, type, mentioned] = m;
    var translated;
    switch (type) {
      case '@&':
          var role = message.guild.roles.find('id', mentioned);
          if (role) translated = "@" + role.name;
          else translated = "@deleted-role";
        break;
      case '@!':
          var member = message.guild.members.find('id', mentioned);
          if (member) translated = "@" + member.displayName;
          else translated = "@deleted-user";
        break;
      case '@':
          var member = message.guild.members.find('id', mentioned);
          if (member) translated = "@" + member.displayName;
          else translated = "@deleted-user";
        break;
      case '#':
          var channel = message.guild.channels.find('id', mentioned);
          if (channel) translated = "#" + channel.name;
          else translated = "@deleted-channel";
        break;
      default:
        translated = mentioned;
    }
    content = content.replace(full, translated);
  }
  return content;
}

exports.init = init;
exports.status = function() {
  return {
    "Twitch client state": tmiClient.readyState(),
    "Twitch channel": TWITCHORD_CONFIG.twitchChannel || "#test",
    "Discord channel ID": TWITCHORD_CONFIG.discordChannelId
  }
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
