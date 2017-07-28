var moment = require('moment');
var purrplingBot = require("../../purrplingbot.js");
var config = require("../../config.json");
require('twix');

exports.commands = [
  "hello",
  "say",
  "whois",
  "status",
  "users",
  "uptime"
]

exports.hello = {
  "description": "Greeting the bot and get greeting back!",
  "exec": function(message) {
    message.channel.send(`Hello, ${message.author}`).
    then(console.log(`Greeting ${message.author.username} in #${message.channel.name}`))
    .catch(console.error);
  }
}

exports.say = {
  "description": "Tell the bot words, where bot say (require admin perms to bot).",
  "usage": "<message>",
  "exec": function(message, tail) {
    if ("admins" in config) {
      if (config.admins.indexOf(message.author.username) > -1) {
        message.channel.send(tail)
        .then(console.log(`I said '${tail}' requested by '${message.author.username}'`))
        .catch(console.error);
      } else {
        message.channel.send("Mňaaaau!! Ty mi nemáš co poroučet, co mám nebo nemám říkat :P")
        .then(console.log(`User '%s' has no permissions for command 'say'!`))
        .catch(console.error);
      }
    } else {
      console.warn("Node 'admins' is not defined in configuration!");
    }
  }
}

exports.whois = {
  "description": "Prints info about user",
  "usage": "<user>",
  "exec": function(message, tail) {
    var requestedWhois = tail; //Save original tail as requested WHOIS string
    if (!tail.length && tail != null) {
      tail = message.author.id; //take message author id => requested user is ME
      requestedWhois = message.author.username; //Save my user name as requested WHOIS
    }
    if(tail.startsWith('<@')){
				tail = tail.substr(2,tail.length-3); //Mention? Get user's ID from it!
		}
    var member = message.channel.guild.members.find("id", tail); //catch member by id
    if (!member) {
      member = message.channel.guild.members.find("nickname", tail); //catch member by nickname
    }
    if (!member) {
      member = message.channel.guild.members.find(function findByUserName(member) {
        return member.user.username === tail; //catch member by user.username
      });
    }
    //console.log(member);
    if (!member) {
      //Member not found
      message.reply("Takovýho uživatele tady neznám :(")
      .then(console.log(`Unknown user: ${requestedWhois} - Can't print info about it!`))
      .catch(console.error);
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
    .then(console.log(`Printing user's '${member.user.username}' info to channel #${message.channel.name}, requested by: ${message.author.username}`))
    .catch(console.error);
  }
}

exports.status = {
  "description": "Get a status info about bot",
  "exec": function (message) {
    var stats = purrplingBot.getStats();
    var plugins = purrplingBot.getPluginRegistry();
    var plugins_disabled = purrplingBot.getDisabledPlugins();
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
        "Loaded plugins: " + Object.keys(plugins).length + "\n" +
        "Disabled plugins: " + Object.keys(plugins_disabled).length + "\n" +
        "Admins: " + config.admins + "\n" +
        "Online since: " + moment(bot.readyAt).format("DD.MM.YYYY HH:mm:ss") + " (Uptime: " + moment(bot.readyAt).twix(new Date()).humanizeLength() +")";
        message.channel.send(stat_info)
        .then(console.log(`Printed status information to '${message.author.username}' on channel '#${message.channel.name}'`))
        .catch(console.error);
  }
}

exports.users = {
  "description": "Get a user list on this server",
  "exec": function(message) {
    var members = message.channel.guild.members;
    var memberlist = "Members joined on this server: \n";
    members.forEach(member => {
      var user = member.user;
      memberlist += user.username + (member.nickname ? "(" + member.nickname + "" : "") + " [" + ( member.presence.status ? member.presence.status.toUpperCase() : "OFFLINE") + "]" + ", In game: " + (user.game ? "Yes": "No") + "\n";
    });
    message.channel.send(memberlist)
    .then(console.log(`Requested user list sent! List length: ${members.array().length}\t User: ${message.author.username}\t Channel: #${message.channel.name}`))
    .catch(console.error);
  }
}

exports.uptime = {
  "description": "Get uptime of bot",
  "exec": function(message) {
    var bot = message.client;
    message.channel.send(`Uptime: ${moment(bot.readyAt).twix(new Date()).humanizeLength()} \nReady at: ${moment(bot.readyAt).format("DD.MM.YYYY HH:mm:ss")}`)
    .then(console.log(`Uptime sent to #${message.channel.name} requested by: ${message.author.username}`))
    .catch(console.error);
  }
}
