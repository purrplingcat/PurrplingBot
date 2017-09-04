var moment = require('moment');
var PurrplingBot = require("../../purrplingbot.js");
var config = PurrplingBot.getConfiguration();
var logger;

const twitch_token = config.twitch.twitch_token;
const twitch_channel_name = config.twitch.twitch_channel_name;
const twitch_channel_id = config.twitch.twitch_channel_id;

exports.commands = [
  "chaninfo"
]

function getChanInfo(channel) {
  var chaninfo = "";
  logger.log("Getting informations about channel %s ID: %s", (channel.name ? "#" + channel.name : "@" + channel.recipient), channel.id);
  if (channel.type != "dm") chaninfo += "Channel name: #" + channel.name + "\n";
  chaninfo += "Channel ID: " + channel.id + "\n";
  chaninfo += "Created At: " + moment(channel.createdAt).format("DD.MM.YYYY HH:mm:ss") + "\n";
  chaninfo += "Type: " + channel.type + "\n";

  switch (channel.type) {
    case 'text':
        chaninfo += "Topic: " + channel.topic + "\n";
        chaninfo += "Nsfw: " + (channel.nsfw ? "yes" : "no") + "\n";
        chaninfo += "Count of members: " + channel.members.keyArray().length + "\n";
        chaninfo += "Members: " + channel.members.map(member => member.displayName).join(', ') + "\n";
      break;
    case 'voice':
        chaninfo += "Bitrate: " + channel.bitrate + " bps\n";
        chaninfo += "Voice full: " + (channel.full ? "yes" : "no") + "\n";
        chaninfo += "User limit: " + channel.userLimit + "\n";
        chaninfo += "Count of joined members: " + channel.members.keyArray().length + "\n";
        chaninfo += "Joined members: " + channel.members.map(member => member.displayName).join(', ') + "\n";
      break;
    case 'dm':
        chaninfo += "Recipient: " + channel.recipient.username + "\n";
      break;
  }
  return chaninfo;
}

function parseChannelID(channelSlug) {
  if (channelSlug.startsWith("<#")) {
    return channelSlug.substr(2, channelSlug.length - 3);
  }
  return channelSlug;
}

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
}

exports.chaninfo = {
  "description": "Get an informations about channel",
  "exec": function(message, tail) {
    var channel, channelID;
    if (!tail || !message.guild) channel = message.channel;
    else {
      channelID = parseChannelID(tail);
      channel = message.guild.channels.find('name', channelID);
      if (!channel) channel = message.guild.channels.find('id', channelID);
      if (!channel) {
        message.channel.send(`Unknown channel ${tail}`);
        return;
      }
    }
    message.channel.send(getChanInfo(channel));
  }
};

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
