const moment = require('moment');
const PurrplingBot = require("../../purrplingbot.js");
const SimpleCommand = require("../../common/commands/simpleCommand");
var pluginRegistry = PurrplingBot.getPluginRegistry();
var client = PurrplingBot.getDiscordClient();
var store = PurrplingBot.getStore();
var config = PurrplingBot.getConfiguration();
require('twix');

var logger;

exports.commands = [
  "hello",
  "say",
  "whois",
  "avatar",
  "status",
  "users"
]

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
}

function findMember(members, knownName) {
  // Remove envelope, if knownName is an user ID from a mention
  if(knownName.startsWith('<@')){
      knownName = knownName.substr(2,knownName.length-3); // Mention? Get user's ID from it!
  }
  // Try a find a member
  var member = members.find("id", knownName); // Catch member by id
  if (!member) {
    member = members.find("nickname", knownName); // Catch member by nickname
  }
  if (!member) {
    member = members.find(function findByUserName(member) {
      return member.user.username === knownName; // Catch member by user.username
    });
  }
  return member;
}

function findChannel(channels, knownChanName) {
    if (knownChanName.startsWith("<#")) {
      knownChanName = knownChanName.substr(2, knownChanName.length - 3);
    }
    return channels.find("id", knownChanName);
}

function execHello(cmdMessage) {
  cmdMessage.channel.send(`Hello, ${cmdMessage.caller}`).
  then(logger.info(`Greeting ${cmdMessage.caller.username} in #${cmdMessage.channel.name}`))
  .catch(logger.error);
}

function execSay(cmdMessage) {
  if (!cmdMessage.hasArgs()) {
    cmdMessage.channel.send("Nějak jsem neslyšela, co to mám vlastně říct.")
    .then(logger.info(`Nothing to say - args empty!`))
    .catch(logger.error);
    return;
  }
  var tail = cmdMessage.argsString;
  var [ chanName ] = cmdMessage.args;
  var channel = findChannel(cmdMessage.channel.guild.channels, chanName);
  if (!channel) {
    channel = cmdMessage.channel;
  } else {
    tail = cmdMessage.shift().argsString;
  }
  channel.send(tail)
  .then(logger.info(`I said '${tail}' requested by '${cmdMessage.caller.username}' to #${channel.name}`))
  .catch(err => {
    cmdMessage.reply(`Je mi líto, ale zprávu se nepodařilo do kanálu ${channel} odeslat! :crying_cat_face:`)
    .then(logger.error(`Message can't be sent: ${err}`))
    .catch(logger.error);
  });
  if (channel.id != cmdMessage.channel.id) {
    cmdMessage.channel.send(`Zpráva byla odeslána do kanálu ${channel}`)
    .then(logger.info(`Reciept sent to #${channel.name}`))
    .catch(logger.error);
  }
}

function execWhois(cmdMessage) {
  var [ userID ] = cmdMessage.args; 
  var requestedWhois = userID; //Save original user ID as requested WHOIS string
  if (!cmdMessage.hasArgs()) {
    userID = cmdMessage.caller.id; //take message caller id => requested user is ME
    requestedWhois = cmdMessage.caller.username; //Save my user name as requested WHOIS
  }
  member = findMember(cmdMessage.channel.guild.members, userID);
  if (!member) {
    //Member not found
    cmdMessage.reply("Takovýho uživatele tady neznám :(")
    .then(logger.info(`Unknown user: ${requestedWhois} - Can't print info about it!`))
    .catch(logger.error);
    return;
  }
  var user_info = "WHOIS " + requestedWhois + "\n" +
      "User ID: " + member.id + "\n" +
      "Username: " + member.user.username + "\n" +
      "Is bot: " + (member.user.bot ? "Yes" : "No") + "\n" +
      "Highest role: " + (member.highestRole.name != "@everyone" ? member.highestRole.name : "no role") + "\n" +
      "Nickname: " + (member.nickname ? member.nickname : member.user.username) + "\n" +
      "Status: " + member.presence.status.toUpperCase() + "\n" +
      "Game: " + (member.presence.game ? member.presence.game.name : "User not playing now!") + "\n" +
      "Joined at: " + moment(member.joinedAt).format("DD.MM.YYYY HH:mm:ss");
  cmdMessage.channel.send(user_info)
  .then(logger.info(`Printing user's '${member.user.username}' info to channel #${cmdMessage.channel.name}, requested by: ${cmdMessage.caller.username}`))
  .catch(logger.error);
}

function execAvatar(cmdMessage) {
  var [ userID ] = cmdMessage.args;
  var requestedWhois = userID; //Save original userID as requested WHOIS string
  if (!cmdMessage.hasArgs()) {
    userID = cmdMessage.caller.id; //take message caller id => requested user is ME
    requestedWhois = cmdMessage.caller.username; //Save my user name as requested WHOIS
  }
  var member = findMember(cmdMessage.channel.guild.members, userID);
  if (!member) {
    //Member not found
    cmdMessage.reply("Takovýho uživatele tady neznám :(")
    .then(logger.info(`Unknown user: ${requestedWhois} - Can't get user's avatar!`))
    .catch(logger.error);
    return;
  }
  var avatar = member.user.defaultAvatarURL;
  if (member.user.avatar) {
    avatar = member.user.avatarURL;
  }
  cmdMessage.channel.send(avatar)
  .then(logger.info(`Sending user's '${member.user.username}' avatar to channel #${cmdMessage.channel.name}, requested by: ${cmdMessage.caller.username}`))
  .catch(logger.error);
}

function execStatus(cmdMessage) {
  var stats = PurrplingBot.getStats();
  var pluginsCount = pluginRegistry.countPlugins();
  var plugins_disabledCount = pluginRegistry.countDisabledPlugins();
  var cmds = PurrplingBot.Commander.Commands;
  var bot = PurrplingBot.DiscordClient;
  var admins = config.admins || [];
  var adminsString = bot.users.filter(user => admins.includes(user.id))
                        .map(user => user.username)
                        .join(', ');
  var stat_info =
      "Connected on: " + bot.guilds.array().length + " servers\n" +
      "My username is: " + bot.user.username + (bot.user.email ? " <" + bot.user.email + ">" : "") + "\n" +
      "Presence status: " + bot.user.presence.status.toUpperCase() + "\n" +
      "Discriminator: " + bot.discriminator + "\n" +
      "Count of reconnections: " + stats.numberOfReconnection + "\n" +
      "Count of handled commands: " + stats.commandsHandled + "\n" +
      "Registered commands: " + Object.keys(cmds).length + "\n" +
      "Loaded plugins: " + pluginsCount + "\n" +
      "Disabled plugins: " + plugins_disabledCount + "\n" +
      "Admins: " + (adminsString.length ? adminsString : "*no admins*") + "\n" +
      "Online since: " + moment(bot.readyAt).format("DD.MM.YYYY HH:mm:ss") + " (Uptime: " + moment(bot.readyAt).twix(new Date()).humanizeLength() +")";
      cmdMessage.channel.send(stat_info)
      .then(logger.info(`Printed status information to '${cmdMessage.caller.username}' on channel '#${cmdMessage.channel.name}'`))
      .catch(logger.error);
}

function execUsers(cmdMessage) {
  var members = cmdMessage.channel.guild.members;
  var memberlist = "Members joined on this server: " + members.array().length + "\n\n";
  members.forEach(member => {
    var user = member.user;
    memberlist += user.username + (member.nickname ? "(" + member.nickname + "" : "") + " [" + ( member.presence.status ? member.presence.status.toUpperCase() : "OFFLINE") + "]" + ", In game: " + (user.presence.game ? "Yes": "No") + "\n";
  });
  cmdMessage.channel.send(memberlist)
  .then(logger.info(`Requested user list sent! List length: ${members.array().length}\t User: ${cmdMessage.caller.username}\t Channel: #${cmdMessage.channel.name}`))
  .catch(logger.error);
}

exports.hello = new SimpleCommand(execHello, PurrplingBot.Commander)
  .setDescription("Greeting the bot and get greeting back!");

exports.say = new SimpleCommand(execSay, PurrplingBot.Commander)
  .setDescription("Tell the bot words, where bot say (require admin perms to bot).")
  .setUsage("[#<channel>] <message>")
  .setExample("%cmd% I love cats!\n%cmd% #general Cats is best!")
  .setRestrictions("ADMINISTRATOR");

exports.whois = new SimpleCommand(execWhois, PurrplingBot.Commander)
  .setDescription("Prints info about user")
  .setUsage("[<user>]");

exports.avatar = new SimpleCommand(execAvatar, PurrplingBot.Commander)
  .setDescription("Get an avatar URL of user")
  .setUsage("[<user>]");

exports.status = new SimpleCommand(execStatus, PurrplingBot.Commander)
  .setDescription("Get a status info about bot");

exports.users = new SimpleCommand(execUsers, PurrplingBot.Commander)
  .setDescription("Get a user list on this server");

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
