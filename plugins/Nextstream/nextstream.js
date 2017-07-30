var request = require("request");
var PurrplingBot = require("../../purrplingbot.js");
var config = require("../../config.json");
var logger;

const twitch_token = config.twitch.twitch_token;
const twitch_channel_name = config.twitch.twitch_channel_name;
const twitch_channel_id = config.twitch.twitch_channel_id;

exports.commands = [
  "nextstream"
]

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
}

exports.nextstream = {
  "description": "Streaming cat now? Or when will next stream?",
  "exec": function(message) {
    var request_url = "https://api.twitch.tv/v5/channels/" + twitch_channel_id + "/events?client_id=" + twitch_token;
    request({
      url: request_url,
      json: true,
    }, function (error, response, body) {
      logger.log("Request: %s", request_url);
      if (!error && response.statusCode === 200) {
        var msg = "Další stream bude, až bude cat vysílat. Momentálně nevím o ničem naplánovaném :cat:";
        if (body.events.hasOwnProperty(0)) {
          var e = body.events[0];
          var streamStartTime = new Date(e.start_time);
          var streamEndTime = new Date(e.end_time);
          var currentTime = new Date();
          if (currentTime.getTime() > streamStartTime.getTime() && currentTime.getTime() < streamEndTime.getTime()) {
            msg = "Cat právě vysílá: '" + e.title + "'! Nebo alespoň by podle plánu vysílat měla. Nenech si to ujít, sleduj na https://www.twitch.tv/" + twitch_channel_name;
            logger.log("Stream is live!\t Stream name: %s \t Channel name: %s", e.title, twitch_channel_name);
          }
          else if (currentTime.getTime() < streamStartTime.getTime()) {
            msg = "Další stream: '" + e.title + "' bude " + streamStartTime.toString() + " https://www.twitch.tv/events/" + e._id;
            logger.log("Next stream comming soon!\t Stream name: %s \t Stream starts: %s", e.title, streamStartTime);
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
        .then(logger.error("An error occured while fetching stream events! Status code: %s", response.statusCode))
        .catch(logger.error);
      }
    });
  }
};

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
