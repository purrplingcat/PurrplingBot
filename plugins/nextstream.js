var request = require("request");
var config = require("../config.json");

exports.commands = [
  "nextstream"
]

var twitch_token = config.nextstream.twitch_token;
var twitch_channel_name = config.nextstream.twitch_channel_name;

exports.nextstream = {
  "description": "Streaming cat now? Or when will next stream?",
  "exec": function(bot, metadata) {
    var request_url = "https://api.twitch.tv/v5/channels/125991922/events?client_id=" + twitch_token;
    request({
      url: request_url,
      json: true,
    }, function (error, response, body) {
      console.log("Request: %s", request_url);
      if (!error && response.statusCode === 200) {
        var msg = "Další stream bude, až bude cat vysílat. Momentálně nevím o ničem naplánovaném :cat:";
        if (body.events.hasOwnProperty(0)) {
          var e = body.events[0];
          var streamStartTime = new Date(e.start_time);
          var streamEndTime = new Date(e.end_time);
          var currentTime = new Date();
          if (currentTime.getTime() > streamStartTime.getTime() && currentTime.getTime() < streamEndTime.getTime()) {
            msg = "Cat právě vysílá: '" + e.title + "'! Nebo alespoň by podle plánu vysílat měla. Nenech si to ujít, sleduj na https://www.twitch.tv/" + twitch_channel_name;
            console.log("Stream is live!\t Stream name: %s \t Channel name: %s", e.title, twitch_channel_name);
          }
          else if (currentTime.getTime() < streamStartTime.getTime()) {
            msg = "Další stream: '" + e.title + "' bude " + streamStartTime.toString() + " https://www.twitch.tv/events/" + e._id;
            console.log("Next stream comming soon!\t Stream name: %s \t Stream starts: %s", e.title, streamStartTime);
          }
          else {
            msg = "Cat pravděpodobně už nevysílá. Chvilku vydrž, než to zjistím, a zkus to později.";
            console.warn("Unknown stream state! Stream name: %s \t Stream starts: %s \t Stream ends: %s \t Current time: %s", e.title, streamStartTime, streamEndTime, currentTime);
          }
        }
        else {
          console.log("No stream planned!");
        }
        bot.sendMessage({
          to: metadata.channelID,
          message: msg
        });
        console.info("Information about stream sent!");
      } else {
        console.error("An error occured while fetching stream events! Status code: %s", response.statusCode);
      }
    });
  }
};
