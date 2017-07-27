var moment = require('moment');
var purrplingBot = require("../../purrplingbot.js");
var config = require("../../config.json");

exports.commands = [
  "hello",
  "say",
  "whois",
  "status",
  "users"
]

function findUser(username, users) {
  for (id in users) {
    if (username === users[id].username) {
      return users[id];
    }
  }
}

function findMemberByChannelAndUserId(userID, channelID, servers) {
  for (serverID in servers) {
    var server = servers[serverID];
    if (channelID in server.channels) {
      for (memberID in server.members) {
        if (memberID === userID) {
          return server.members[memberID];
        }
      }
    }
  }
}

function getMembersOnServerByChannelID(channelID, servers) {
  for (id in servers) {
    var server = servers[id];
    if (channelID in server.channels) {
      return server.members;
    }
  }
}

exports.hello = {
  "description": "Greeting the bot and get greeting back!",
  "exec": function(bot, metadata) {
    bot.sendMessage({
      to: metadata.channelID,
      message: "Hello " + metadata.user
    });
    console.log("Greeting %s in %s", metadata.user, metadata.channelID);
  }
}

exports.say = {
  "description": "Tell the bot words, where bot say (require admin perms to bot).",
  "usage": "<message>",
  "exec": function(bot, metadata, message) {
    if ("admins" in config) {
      if (config.admins.indexOf(metadata.user) > -1) {
        bot.sendMessage({
          to: metadata.channelID,
          message: message
        });
        console.log("I said '%s' requested by '%s'", message, metadata.user);
      } else {
        bot.sendMessage({
          to: metadata.channelID,
          message: "Mňaaaau!! Ty mi nemáš co poroučet, co mám nebo nemám říkat :P"
        });
        console.log("User '%s' has no permissions for command 'say'!", metadata.user);
      }
    } else {
      console.warn("Node 'admins' is not defined in configuration!");
    }
  }
}

exports.whois = {
  "description": "Prints info about user",
  "usage": "<user>",
  "exec": function(bot, metadata, message) {
    if (!message.length && message != null) {
      message = metadata.user;
    }
    var user = findUser(message, bot.users);
    var member = findMemberByChannelAndUserId(user.id, metadata.channelID, bot.servers);
    console.log(member);
    if (!user) {
      bot.sendMessage({
        to: metadata.channelID,
        message: "Takovýho uživatele tady neznám :("
      });
      console.log("Unknown user: %s - Can't print info about it!", message);
      return;
    }
    var user_info = "WHOIS " + message + "\n" +
        "User ID: " + user.id + "\n" +
        "Username: " + user.username + "\n" +
        "Discriminator: " + user.discriminator + "\n" +
        "Is bot: " + (user.bot ? "Yes" : "No") + "\n" +
        "Nick on this server: " + member.nick + "\n" +
        "Status: " + member.status.toUpperCase() + "\n" +
        "Game: " + (user.game ? user.game.name : "Not playing/streaming now!") + "\n" +
        "Joined at: " + moment(member.joined_at).format("DD.MM.YYYY HH:MM:ss");
    bot.sendMessage({
      to: metadata.channelID,
      message: user_info
    });
    console.log("Printing user's '%s' info to channelID '%s', requested by '%s'", message, metadata.channelID, metadata.user);
  }
}

exports.status = {
  "description": "Get a status info about bot",
  "exec": function (bot, metadata) {
    var stats = purrplingBot.getStats();
    var plugins = purrplingBot.getPluginRegistry();
    var plugins_disabled = purrplingBot.getDisabledPlugins();
    var cmds = purrplingBot.getCommandRegistry();
    var stat_info = "BEGIN OF status >>\n" +
        "Connected on: " + Object.keys(bot.servers).length + " servers\n" +
        "My username is: " + bot.username + " <" + bot.email + ">\n" +
        "Presence status: " + bot.presenceStatus.toUpperCase() + "\n" +
        "Discriminator: " + bot.discriminator + "\n" +
        "Count of reconnections: " + stats.numberOfReconnection + "\n" +
        "Count of handled commands: " + stats.commandsHandled + "\n" +
        "Registered commands: " + Object.keys(cmds).length + "\n" +
        "Loaded plugins: " + Object.keys(plugins).length + "\n" +
        "Disabled plugins: " + Object.keys(plugins_disabled).length + "\n" +
        "Admins: " + config.admins + "\n" +
        "Online since: " + moment(stats.onlineSinceTime).format("DD.MM.YYYY HH:MM:ss") + "\n" +
        "<< END OF status"
        bot.sendMessage({
          to: metadata.channelID,
          message: stat_info
        });
        console.log("Printed status information to '%s' on channelID '%s'", metadata.user, metadata.channelID);
  }
}

exports.users = {
  "description": "Get a user list on this server",
  "exec": function(bot, metadata) {
    var members = getMembersOnServerByChannelID(metadata.channelID, bot.servers);
    var memberlist = "Members joined on this server: \n";
    for (memberID in members) {
      var member = members[memberID];
      var user = bot.users[memberID];
      memberlist += user.username + (member.nick ? "(" + member.nick + "" : "") + " [" + ( member.status ? member.status.toUpperCase() : "OFFLINE") + "]" + ", In game: " + (user.game ? "Yes": "No") + "\n";
    }
    bot.sendMessage({
      to: metadata.channelID,
      message: memberlist
    });
    console.log("Requested user list sent! List length: %s\tUser: %s\t Channel: %s", Object.keys(members).length, metadata.user, metadata.channelID);
  }
}
