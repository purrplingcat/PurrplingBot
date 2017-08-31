var PurrplingBot = require("../../purrplingbot.js");
var eventBus = PurrplingBot.getEventBus();
const CONFIG = PurrplingBot.getConfiguration();

const IGNORELIST_STORE = "./ignorelist.json";

const TYPE_REACT = "REACT";
const TYPE_MUMBLE = "MUMBLE";

var ignoreList = [];
var mumblebox = {};

var logger;

exports.commands = [
  "mumbles"
];

function matchMumbles(inputStr, mumbles) {
  var matchedMumbles = [];
  for (mumbleSource in mumbles) {
    try {
      // Match a mumble. Flags: global, case insensitive, full unicode matching
      var matches = inputStr.match(new RegExp(mumbleSource, "giu"));
    } catch(err) {
      logger.error("Error while matching REGEX!");
      logger.error(err);
      logger.info("I am still running!");
    }
    if (matches) {
      var content = mumbles[mumbleSource];
      var rand = 0;
      var alters;
      if (content instanceof Array) {
        // Select random mumble
        rand = Math.floor((Math.random() * content.length));
        alters = content;
        content = content[rand];
      }
      matchedMumbles.push({
        "index": rand,
        "phrase": mumbleSource,
        "content": content,
        "alters": alters
      });
    }
  }
  return matchedMumbles;
}

function matchAndSendMumble(message, type) {
  if (type === TYPE_REACT) {
    var source = mumblebox.reactions || {};
  } else if (type === TYPE_MUMBLE) {
    var source = mumblebox.mumbles || {};
  } else {
    throw new Error("Invalid mumble type: " + type);
  }
  if (message.author.id === message.client.user.id) {
    return; // ignore self messages
  }
  var mumbles = matchMumbles(message.content, source);
  if (mumbles.length) {
    if (ignoreList.indexOf(message.author.username) >= 0) {
      logger.log(`User ${message.author.username} on #${message.channel.name} ignored for mumbles!`);
      return;
    }
    var rand = Math.floor((Math.random() * mumbles.length));
    var mumble = mumbles[rand];
    var log_message = `(ACT:${type}) Matched phrase "${mumble.phrase}" in message "${message.content}" from #${message.channel.name} User: ${message.author.username}! Reply sent: "${mumble.content}" [ID: ${rand},${mumble.index}]`;
    if (type === TYPE_MUMBLE) {
      message.channel.send(mumble.content)
      .then(logger.log(log_message))
      .catch(logger.error);
    } else if (type === TYPE_REACT) {
      message.react(mumble.content)
      .then(logger.log(log_message))
      .catch(logger.error);
    }
  }
}

function storeIgnoreList() {
  // ONLY story function. Ignore list will be restored by require()
  logger.dir(ignoreList);
  fs = require('fs');
  var json = JSON.stringify(ignoreList);
  fs.writeFile(IGNORELIST_STORE, json, 'utf8', err => {
    if (err) {
      logger.error("An error occured while storing ignoreList!");
      logger.error(err);
    } else {
      logger.log("Ignore list was stored!");
    }
  });
}

function restoreIgnoreList() {
  fs = require('fs');
  var json = fs.readFileSync(IGNORELIST_STORE, 'utf8').toString();
  ignoreList = JSON.parse(json);
}

function readMumblebox(jsonFileName) {
  try {
    fs = require('fs');
    var json = fs.readFileSync(jsonFileName, 'utf8').toString();
    logger.info("Loaded mumblebox config file: %s", jsonFileName);
    return JSON.parse(json);
  } catch(err) {
    logger.error("Failed while reading %s - using defaults", jsonFileName);
    logger.error(err);
    return {};
  }
}

function execSubCommand(scmd, args, message) {
  switch (scmd) {
    case 'ignore':
        if (ignoreList.indexOf(message.author.username) >= 0) {
          message.reply("You are already ignored!")
          .catch(logger.error);
          logger.log(`User ${message.author.username} already ignored!`);
          return;
        }
        ignoreList.push(message.author.username);
        message.reply("You are ignored for my mumbles and reacts.")
        .catch(logger.error);
        logger.log(`User ${message.author.username} ignored for mumbles and reacts`);
        storeIgnoreList(); // Save ignore list to a file
      break;
    case 'unignore':
        var index = ignoreList.indexOf(message.author.username);
        if (index >= 0) {
            ignoreList.splice(index);
            message.reply("You are unignored for mumbles.")
            .catch(logger.error);
            logger.log(`User ${message.author.username} unignored for mumbles and reacts`);
            storeIgnoreList(); // Save ignore list to a file
        } else {
          logger.log(`Can't remove user ${message.author.username} - NOT in ignore list!`);
          message.reply("You are NOT in ignore list!")
          .catch(logger.error);
        }
      break;
    case 'ignorelist':
      var msg = "There are no ignored users. Ignorelist empty.";
      if (ignoreList.length) {
        msg = `Ignored users: ${ignoreList}`;
      }
      message.channel.send(msg)
      .then(logger.log(`Ignore list sent to #${message.channel.name} requested by: ${message.author.username}`))
      break;
    case 'help':
      message.channel.send("Availaible subcommands:\n"
        + "ignore - Add you to ignore list (bot not reacts on you with mumbles)\n"
        + "unignore - Remove you from ignore list\n"
        + "ignorelist - Show ignored users\n"
        + "help - This help message")
      .then(logger.log(`Requested help by ${message.author.username} on #${message.author.username} was sent`))
      .catch(logger.error);
     break;
    default:
      message.reply(`Unknown mumbles subcommand: ${scmd}`)
      .then(logger.log(`Unknown mumbles subcommand: ${scmd}`))
      .catch(logger.error);
  }
}

eventBus.on("message", function(message, isCmd){
  if (mumblebox.ignoredChannelIDs && !mumblebox.ignoredChannelIDs.indexOf(message.channel.id)) {
    return; // Channel is in ignore list? Don't match mumbles
  }
  if (!isCmd) {
    matchAndSendMumble(message, TYPE_REACT); // React to a message
    matchAndSendMumble(message, TYPE_MUMBLE); // Reply to a message
  }
});

eventBus.on("messageUpdate", function(oldMessage, newMessage, isCmd) {
  if (mumblebox.ignoredChannelIDs && !mumblebox.ignoredChannelIDs.indexOf(newMessage.channel.id)) {
    return; // Channel is in ignore list? Don't match mumbles
  }
  if (!isCmd) {
    matchAndSendMumble(newMessage, TYPE_REACT); // React to a message
    matchAndSendMumble(oldMessage, TYPE_MUMBLE); // Reply to a message
  }
});

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  if (!CONFIG.mumblebox || !Object.keys(CONFIG.mumblebox).length) {
    logger.warn("Mumblebox config is not defined! No mumbles for match&talk");
  } else {
    mumblebox = CONFIG.mumblebox;
    //logger.dir(mumblebox);
  }
  try {
    restoreIgnoreList();
    logger.log("Restored ignore list. Ignored chatters: %s", ignoreList);
  } catch(err) {
    logger.warn("Can't restore ignore list! %s", err);
  }
}

exports.mumbles = {
  "description": "Control a bot's mumbles and reactions",
  "usage": "<ignoreme|unignoreme|ignorelist|help>",
  "exec": function(message, tail) {
    if (!tail.length || tail == null) {
      tail = "help";
    }
    var args = tail.split(" ");
    var scmd = args.shift();
    logger.log(`Handle subcommand: ${tail} on #${message.channel.name} by ${message.author.username}`);
    execSubCommand(scmd, args, message);
  }
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
