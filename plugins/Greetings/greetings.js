const PurrplingBot = require("../../purrplingbot.js");
const SimpleCommand = require("../../common/commands/simpleCommand");
var bot = PurrplingBot.getDiscordClient();
var store = PurrplingBot.getStore();
const CONFIG = PurrplingBot.getConfiguration();

var logger;
var lastuser = {};

const LASTUSER_STORE = "lastuser";

exports.commands = [
  "lastuser"
];

function storeLastUser() {
  logger.info("Store last user to data storage");
  store.storeScope(LASTUSER_STORE, lastuser)
  .flush();
}

function restoreLastUser() {
  logger.info("Restore last user from data storage");
  lastuser = store.restoreScope(LASTUSER_STORE);
}

bot.on('guildMemberAdd', function (member) {
  var greeting_cmdMessage = "Welcome!";
  if (!CONFIG.greetings) {
    channel = member.guild.defaultChannel;
  } else {
    channel = member.guild.channels.find('id', CONFIG.greetings.channelID);
    greeting_cmdMessage = CONFIG.greetings.greetingMessage || greeting_cmdMessage;
  }
  if (!channel) {
    logger.error("Greeting channel was not set or not found!");
    return;
  }
  channel.send(`${member.user} ${greeting_cmdMessage}`)
  .then(logger.info(`Greeting new user: ${member.user.username}`))
  .catch(logger.error);
  lastuser[member.guild.id] = {
    "id": member.user.id,
    "username": member.user.username,
    "server": member.guild.name,
    "joinedAt": member.joinedAt
  };
  PurrplingBot.logEvent(`New user '${member.displayName}' joined server!`, "GuildMemberAdd");
  storeLastUser(); //save last joined user info
});

bot.on('guildMemberUpdate', function(oldMember, newMember) {
  if (!CONFIG.greetings) {
    channel = newMember.guild.defaultChannel;
  } else {
    channel = newMember.guild.channels.find('id', CONFIG.greetings.channelID);
  }
  if (!channel) {
    logger.error("Greeting channel was not set or not found!");
    return;
  }
  // Nickname changed
  if (oldMember.nickname != newMember.nickname) {
    channel.send(`${oldMember.user} Changed her/his nickname from **${oldMember.nickname ? oldMember.nickname : oldMember.user.username}** to **${newMember.nickname ? newMember.nickname : newMember.user.username}**`)
    .then(logger.info(`Sent info about nickname changed! User: ${oldMember.user.username} From: ${oldMember.nickname} To: ${newMember.nickname}`))
    .catch(logger.error);
    PurrplingBot.logEvent(`User '${oldMember.displayName}' changed nickname to ${newMember.displayName}`, "NicknameChange");
  }
});

bot.on('guildMemberRemove', function (member) {
  PurrplingBot.logEvent(`User '${member.displayName} left server!'`, "GuildMemberRemove");
});

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  try {
    restoreLastUser();
    logger.info("Last user restored!");
  } catch (err) {
    logger.warn("Last user can't be restored! " + err);
  }
};

function execLastuser(cmdMessage) {
  var luser = lastuser[cmdMessage.channel.guild.id];
  if (!luser && lastuser.id) {
    luser = lastuser; // Back compatibility with store from old version (v1.2.2 and lower)
  }
  if (luser) {
    cmdMessage.channel.send(`Last joined user is: ${luser.username}\nUser joined at: ${luser.joinedAt}`)
    .then(logger.info(`Printed info about joined user: ${luser.username} JoinedAt: ${luser.joinedAt} Server ${luser.server}`))
    .catch(logger.error);
  } else {
    cmdMessage.channel.send("I don't know about last joined user! Maybe nothing joined this server.")
    .then(logger.info(`No user joined to server: ${cmdMessage.channel.guild}`))
    .catch(logger.error);
  }
}

exports.lastuser = new SimpleCommand(execLastuser, PurrplingBot.Commander)
  .setDescription("Print last username and user's joined at");

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
