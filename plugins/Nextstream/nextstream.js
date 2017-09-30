var request = require("request");
var moment = require('moment');
var PurrplingBot = require("../../purrplingbot.js");
var config = PurrplingBot.getConfiguration();
var client = PurrplingBot.getDiscordClient();
var logger;

const twitch_token = config.twitch.twitch_token;
const twitch_channel_name = config.twitch.twitch_channel_name;
const twitch_channel_id = config.twitch.twitch_channel_id;
const twitch_stream_checker = config.twitch.twitch_stream_checker || {enabled: false, interval: 300};

var previousStreamState = "OFFLINE"
var streamInfo;

exports.commands = [
  "nextstream",
  "livenow"
];

function streamLiveNowAnnounce() {
  var request_url = "https://api.twitch.tv/v5/streams/" + twitch_channel_id + "?client_id=" + twitch_token;
  logger.info("Checking for if %s's stream is live now ...", twitch_channel_name);
  request({
    url: request_url,
    json: true,
  }, function (error, response, body) {
      logger.log("Request: %s", request_url);
      if (!error && response.statusCode === 200) {
        var channel = client.channels.find('id', twitch_stream_checker.announceChannelId);
        if (!body.stream) {
          logger.info("Stream is OFFLINE! Twitch channel: %s", twitch_channel_name);
          if (previousStreamState == "ONLINE") {
            previousStreamState = "OFFLINE";
            if (channel) {
              channel.send(`${streamInfo.channel.display_name} právě ukončila stream!\nTitulek streamu: **${streamInfo.channel.status}**\nHrála: **${streamInfo.channel.game}**`)
              .then(logger.info(`Information about stream sent to #${channel.name}`))
              .catch(logger.error);
            } else {
              logger.error("Can't send info about stream state to channel ID: %s - Channel not found!");
            }
          }
          return;
        }
        logger.info("Stream is ONLINE! Twitch channel: %s", twitch_channel_name);
        if (previousStreamState == "OFFLINE") {
          previousStreamState = "ONLINE";
          streamInfo = body.stream;
          if (channel) {
            channel.send(`@everyone ${streamInfo.channel.display_name} je právě ONLINE! Sleduj to na ${streamInfo.channel.url}\nTitulek streamu: **${streamInfo.channel.status}**\nHraje: **${streamInfo.channel.game}**`,
               {
                 embed: {
                   title: streamInfo.channel.status,
                   url: "https://www.twitch.tv/" + twitch_channel_name,
                   image: {
                     url: streamInfo.preview.medium
                   }
                 }
               }
             )
            .then(logger.info(`Information about stream sent to #${channel.name}`))
            .catch(logger.error);
          } else {
            logger.error("Can't send info about stream state to channel ID: %s - Channel not found!", twitch_stream_checker.announceChannelId);
            PurrplingBot.logEvent("Can't send info about stream state - Channel not found!", "StreamCheck", "ERROR");
          }
        }
      } else {
        logger.error("An error occured while fetching stream status! %s", error);
        logger.dir(body);
        PurrplingBot.logEvent("An error occured while fetching stream status! " + error, "StreamCheck", "WARN");
      }
  });
}

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  const stream_check_enabled = twitch_stream_checker.enabled || false;
  const stream_check_interval = twitch_stream_checker.interval || 300;
  if (stream_check_enabled) {
    client.setInterval(streamLiveNowAnnounce, stream_check_interval * 1000);
    logger.info("Stream live now checker ENABLED");
  }
}

exports.status = function () {
  return {
    "Twitch channel": twitch_channel_name,
    "Stream checker interval": twitch_stream_checker.interval + "s",
    "Stream checker enabled": twitch_stream_checker.enabled,
    "Stream state": previousStreamState
  }
}

exports.nextstream = {
  "description": "Streaming cat now? Or when will next stream?",
  "exec": function(message) {
    var request_url = "https://api.twitch.tv/v5/channels/" + twitch_channel_id + "/events?client_id=" + twitch_token;
    message.channel.startTyping();
    request({
      url: request_url,
      json: true,
    }, function (error, response, body) {
      logger.log("Request: %s", request_url);
      message.channel.stopTyping();
      if (!error && response.statusCode === 200) {
        var msg = "Další stream bude, až bude cat vysílat. Momentálně nevím o ničem naplánovaném :cat:";
        if (body.events.hasOwnProperty(0)) {
          var e = body.events[0];
          var streamStartTime = new Date(e.start_time);
          var streamEndTime = new Date(e.end_time);
          var currentTime = new Date();
          if (currentTime.getTime() > streamStartTime.getTime() && currentTime.getTime() < streamEndTime.getTime()) {
            msg = "Cat právě vysílá: '" + e.title + "'! Nebo alespoň by podle plánu vysílat měla. Nenech si to ujít, sleduj na https://www.twitch.tv/" + twitch_channel_name;
            logger.info("Stream is live!\t Stream name: %s \t Channel name: %s", e.title, twitch_channel_name);
          }
          else if (currentTime.getTime() < streamStartTime.getTime()) {
            msg = "Další plánovaný stream: '" + e.title + "' bude " + moment(streamStartTime).format("DD.MM.YYYY HH:mm:ss") + " - Hrát se bude '" + e.game.name + "' https://www.twitch.tv/events/" + e._id;
            logger.info("Next stream comming soon!\t Stream name: %s \t Stream starts: %s", e.title, streamStartTime);
          }
          else {
            msg = "Cat pravděpodobně už nevysílá. Chvilku vydrž, než to zjistím, a zkus to později.";
            logger.warn("Unknown stream state! Stream name: %s \t Stream starts: %s \t Stream ends: %s \t Current time: %s", e.title, streamStartTime, streamEndTime, currentTime);
          }
        }
        else {
          logger.log("No stream planned!");
        }
        message.channel.send(msg)
        .then(logger.info(`Information about stream sent to #${message.channel.name} requested by: ${message.author.username}`))
        .catch(logger.error);
      } else {
        message.channel.send("Ooops! Něco se rozbilo! Zkus to prosím za chvíli.")
        .then(logger.error("An error occured while fetching stream events! %s", error))
        .catch(logger.error);
      }
    });
  }
};

exports.livenow = {
  "description": "Streaming cat now? Or when will next stream?",
  "exec": function(message) {
    var request_url = "https://api.twitch.tv/v5/streams/" + twitch_channel_id + "?client_id=" + twitch_token;
    logger.info("Checking for if %s's stream is live now ...", twitch_channel_name);
    message.channel.startTyping();
    request({
      url: request_url,
      json: true,
    }, function (error, response, body) {
        logger.log("Request: %s", request_url);
        message.channel.stopTyping();
        if (!error && response.statusCode === 200) {
          var streamInfo = body.stream;
          if (!streamInfo) {
            message.channel.send(`Stream je momentálně OFFLINE. Další informace o plánovaném streamu se dozvíš příkazem \`!nextstream\``)
              .then(logger.info(`Information about stream status sent to #${message.channel.name} requested by: ${message.author.username}`))
              .catch(logger.error);
            return;
          }
          message.channel.send(`Stream je právě ONLINE! Sleduj to na ${streamInfo.channel.url}\nTitulek streamu: **${streamInfo.channel.status}**\nHraje: **${streamInfo.channel.game}**`, { embed: null})
            .then(logger.info(`Information about stream status sent to #${message.channel.name} requested by: ${message.author.username}`))
            .catch(logger.error);
        } else {
          logger.error("An error occured while fetching stream status! %s", error);
          message.channel.send(`Omlouvám se, ale něco se rozbilo. :crying_cat_face: Zkus to prosím později. MŇAU!*`)
            .catch(logger.error);
        }
    });
  }
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
