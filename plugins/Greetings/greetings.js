var PurrplingBot = require("../../purrplingbot.js");
var bot = PurrplingBot.getDiscordClient();
const CONFIG = require("../../config.json");

var logger;
var lastuser;

const LASTUSER_STORE = "./lastuser.json";

exports.commands = [
  "lastuser"
];

function storeLastUser() {
  fs = require('fs');
  var json = JSON.stringify(lastuser);
  fs.writeFile(LASTUSER_STORE, json, 'utf8', err => {
    if (err) {
      logger.error("An error occured while storing last user!");
      logger.error(err);
    } else {
      logger.log("Last user was stored!");
    }
  });
}

function restoreLastUser() {
  fs = require('fs');
  var json = fs.readFileSync(LASTUSER_STORE, 'utf8').toString();
  lastuser = JSON.parse(json);
}

bot.on('guildMemberAdd', function (member) {
  channel = member.guild.channels.find('id', CONFIG.greetings.channelID);
  if (!channel) {
    logger.error("Greeting channel was not set or not found!");
    return;
  }
  channel.send(`${member.user} ${CONFIG.greetings.greetingMessage}`)
  .then(logger.info(`Greeting new user: ${member.user.username}`))
  .catch(logger.error);
  lastuser = {
    "id": member.user.id,
    "username": member.user.username,
    "joinedAt": member.joinedAt
  };
  storeLastUser(); //save last joined user info
});

bot.on('guildMemberUpdate', function(oldMember, newMember) {
  channel = oldMember.guild.channels.find('id', CONFIG.greetings.channelID);
  if (!channel) {
    logger.error("Greeting channel was not set or not found!");
    return;
  }
  // Nickname changed
  if (oldMember.nickname != newMember.nickname) {
    channel.send(`${oldMember.user} Changed her/his nickname from **${oldMember.nickname ? oldMember.nickname : oldMember.user.username}** to **${newMember.nickname ? newMember.nickname : newMember.user.username}**`)
    .then(logger.info(`Sent info about nickname changed! User: ${oldMember.user.username} From: ${oldMember.nickname} To: ${newMember.nickname}`))
    .catch(logger.error);
  }
});

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  try {
    restoreLastUser();
    logger.info("Last user restored!");
  } catch (err) {
    logger.warn("Last user can't be restored! " + err);
  }
}

exports.lastuser = {
  "description": "Print last username and user's joined at",
  "exec": function(message) {
    if (lastuser) {
      message.channel.send(`Last joined user is: ${lastuser.username}\nUser joined at: ${lastuser.joinedAt}`)
      .then(logger.info(`Printed info about joined user: ${lastuser.username} JoinedAt: ${lastuser.joinedAt}`))
      .catch(logger.error);
    } else {
      message.channel.send("I don't know about last joined user! Maybe nothing joined this server.")
      .then(logger.info(`No user joined to server: ${message.channel.guild}`))
      .catch(logger.error);
    }
  }
}
