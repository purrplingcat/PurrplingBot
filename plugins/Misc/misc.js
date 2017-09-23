var moment = require('moment');
var purrplingBot = require("../../purrplingbot.js");
var pluginRegistry = purrplingBot.getPluginRegistry();
var store = purrplingBot.getStore();
var config = purrplingBot.getConfiguration();
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
  logger = purrplingBot.createLogger(pluginName);
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

exports.hello = {
  "description": "Greeting the bot and get greeting back!",
  "exec": function(message) {
    message.channel.send(`Hello, ${message.author}`).
    then(logger.info(`Greeting ${message.author.username} in #${message.channel.name}`))
    .catch(logger.error);
  }
}

exports.say = {
  "description": "Tell the bot words, where bot say (require admin perms to bot).",
  "usage": "[#<channel>] <message>",
  "exec": function(message, tail) {
    if ("admins" in config) {
      if (config.admins.indexOf(message.author.username) > -1) {
        var args = tail.split(" ");
        var channel;
        if (message.channel.guild) {
          channel = findChannel(message.channel.guild.channels, args.shift());
        } else {
          logger.warn(`Channel ${message.channel} is not a TextChannel!`);
        }
        if (!channel) {
          channel = message.channel;
        } else {
          tail = args.join(" ");
        }
        channel.send(tail)
        .then(logger.info(`I said '${tail}' requested by '${message.author.username}' to #${channel.name}`))
        .catch(err => {
          message.reply(`Je mi líto, ale zprávu se nepodařilo do kanálu ${channel} odeslat! :crying_cat_face:`)
          .then(logger.error(`Message can't be sent: ${err}`))
          .catch(logger.error);
        });
        if (channel.id != message.channel.id) {
          message.channel.send(`Zpráva byla odeslána do kanálu ${channel}`)
          .then(logger.info(`Reciept sent to #${message.channel.name}`))
          .catch(logger.error);
        }
      } else {
        message.channel.send("Mňaaaau!! Ty mi nemáš co poroučet, co mám nebo nemám říkat :P")
        .then(logger.info(`User '%s' has no permissions for command 'say'!`))
        .catch(logger.error);
      }
    } else {
      logger.warn("Node 'admins' is not defined in configuration!");
    }
  }
}

exports.whois = {
  "description": "Prints info about user",
  "usage": "[<user>]",
  "exec": function(message, tail) {
    var requestedWhois = tail; //Save original tail as requested WHOIS string
    if (!tail.length && tail != null) {
      tail = message.author.id; //take message author id => requested user is ME
      requestedWhois = message.author.username; //Save my user name as requested WHOIS
    }
    member = findMember(message.channel.guild.members, tail);
    //logger.log(member);
    if (!member) {
      //Member not found
      message.reply("Takovýho uživatele tady neznám :(")
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
    message.channel.send(user_info)
    .then(logger.info(`Printing user's '${member.user.username}' info to channel #${message.channel.name}, requested by: ${message.author.username}`))
    .catch(logger.error);
  }
}

exports.avatar = {
  "description": "Get an avatar URL of user",
  "usage": "[<user>]",
  "exec": function(message, tail) {
    var requestedWhois = tail; //Save original tail as requested WHOIS string
    if (!tail.length && tail != null) {
      tail = message.author.id; //take message author id => requested user is ME
      requestedWhois = message.author.username; //Save my user name as requested WHOIS
    }
    var member = findMember(message.channel.guild.members, tail);
    //logger.log(member);
    if (!member) {
      //Member not found
      message.reply("Takovýho uživatele tady neznám :(")
      .then(logger.info(`Unknown user: ${requestedWhois} - Can't get user's avatar!`))
      .catch(logger.error);
      return;
    }
    var avatar = member.user.defaultAvatarURL;
    if (member.user.avatar) {
      avatar = member.user.avatarURL;
    }
    message.channel.send(avatar)
    .then(logger.info(`Sending user's '${member.user.username}' avatar to channel #${message.channel.name}, requested by: ${message.author.username}`))
    .catch(logger.error);
  }
}

exports.status = {
  "description": "Get a status info about bot",
  "exec": function (message) {
    var stats = purrplingBot.getStats();
    var pluginsCount = pluginRegistry.countPlugins();
    var plugins_disabledCount = pluginRegistry.countDisabledPlugins();
    var cmds = purrplingBot.getCommandRegistry();
    var bot = message.client;
    var stat_info =
        "Connected on: " + bot.guilds.array().length + " servers\n" +
        "My username is: " + bot.user.username + " <" + bot.user.email + ">\n" +
        "Presence status: " + bot.user.presence.status.toUpperCase() + "\n" +
        "Discriminator: " + bot.discriminator + "\n" +
        "Count of reconnections: " + stats.numberOfReconnection + "\n" +
        "Count of handled commands: " + stats.commandsHandled + "\n" +
        "Registered commands: " + Object.keys(cmds).length + "\n" +
        "Loaded plugins: " + pluginsCount + "\n" +
        "Disabled plugins: " + plugins_disabledCount + "\n" +
        "Admins: " + config.admins + "\n" +
        "Online since: " + moment(bot.readyAt).format("DD.MM.YYYY HH:mm:ss") + " (Uptime: " + moment(bot.readyAt).twix(new Date()).humanizeLength() +")";
        message.channel.send(stat_info)
        .then(logger.info(`Printed status information to '${message.author.username}' on channel '#${message.channel.name}'`))
        .catch(logger.error);
  }
}

exports.users = {
  "description": "Get a user list on this server",
  "exec": function(message) {
    var members = message.channel.guild.members;
    var memberlist = "Members joined on this server: " + members.array().length + "\n\n";
    members.forEach(member => {
      var user = member.user;
      memberlist += user.username + (member.nickname ? "(" + member.nickname + "" : "") + " [" + ( member.presence.status ? member.presence.status.toUpperCase() : "OFFLINE") + "]" + ", In game: " + (user.presence.game ? "Yes": "No") + "\n";
    });
    message.channel.send(memberlist)
    .then(logger.info(`Requested user list sent! List length: ${members.array().length}\t User: ${message.author.username}\t Channel: #${message.channel.name}`))
    .catch(logger.error);
  }
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
