var PurrplingBot = require("../../purrplingbot.js");
var eventBus = PurrplingBot.getEventBus();
const CONFIG = require("../../config.json");

const IGNORELIST_STORE = "./ignorelist.json";
var ignoreList = [];

exports.commands = [
  "mumbles"
];

function matchMumbles(inputStr) {
  var mumbles = CONFIG.mumblebox;
  var matchedMumbles = [];
  for (mumbleSource in mumbles) {
    try {
      // Match a mumble. Flags: global, case insensitive, full unicode matching
      var matches = inputStr.match(new RegExp(mumbleSource, "giu"));
    } catch(err) {
      console.error("Error while matching REGEX!");
      console.error(err);
      console.info("I am still running!");
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

function matchAndSendMumble(message) {
  if (message.author.id === message.client.user.id) {
    return; // ignore self messages
  }
  var mumbles = matchMumbles(message.content);
  if (mumbles.length) {
    if (ignoreList.indexOf(message.author.username) >= 0) {
      console.log(`User ${message.author.username} on #${message.channel.name} ignored for mumbles!`);
      return;
    }
    var rand = Math.floor((Math.random() * mumbles.length));
    var mumble = mumbles[rand];
    message.channel.send(mumble.content)
    .then(console.log(`Matched phrase "${mumble.phrase}" in message "${message.content}" from #${message.channel.name} User: ${message.author.username}! Reply sent: "${mumble.content}" [ID: ${rand},${mumble.index}]`))
    .catch(console.error);
  }
}

function storeIgnoreList() {
  // ONLY story function. Ignore list will be restored by require()
  console.dir(ignoreList);
  fs = require('fs');
  var json = JSON.stringify(ignoreList);
  fs.writeFile(IGNORELIST_STORE, json, 'utf8');
}

function restoreIgnoreList() {
  fs = require('fs');
  var json = fs.readFileSync(IGNORELIST_STORE, 'utf8').toString();
  ignoreList = JSON.parse(json);
}

function execSubCommand(scmd, args, message) {
  switch (scmd) {
    case 'ignore':
        if (ignoreList.indexOf(message.author.username) >= 0) {
          message.reply("You are already ignored!")
          .catch(console.error);
          console.log(`User ${message.author.username} already ignored!`);
          return;
        }
        ignoreList.push(message.author.username);
        message.reply("You are ignored for my mumbles and reacts.")
        .catch(console.error);
        console.log(`User ${message.author.username} ignored for mumbles and reacts`);
        storeIgnoreList(); // Save ignore list to a file
        console.log("Ignore list was stored!");
      break;
    case 'unignore':
        var index = ignoreList.indexOf(message.author.username);
        if (index >= 0) {
            ignoreList.splice(index);
            message.reply("You are unignored for mumbles.")
            .catch(console.error);
            console.log(`User ${message.author.username} unignored for mumbles and reacts`);
            storeIgnoreList(); // Save ignore list to a file
            console.log("Ignore list was stored!");
        } else {
          console.log(`Can't remove user ${message.author.username} - NOT in ignore list!`);
          message.reply("You are NOT in ignore list!")
          .catch(console.error);
        }
      break;
    case 'ignorelist':
      var msg = "There are no ignored users. Ignorelist empty.";
      if (ignoreList.length) {
        msg = `Ignored users: ${ignoreList}`;
      }
      message.channel.send(msg)
      .then(console.log(`Ignore list sent to #${message.channel.name} requested by: ${message.author.username}`))
      break;
    case 'help':
      message.channel.send("Availaible subcommands:\n"
        + "ignore - Add you to ignore list (bot not reacts on you with mumbles)\n"
        + "unignore - Remove you from ignore list\n"
        + "ignorelist - Show ignored users\n"
        + "help - This help message")
      .then(console.log(`Requested help by ${message.author.username} on #${message.author.username} was sent`))
      .catch(console.error);
     break;
    default:
      message.reply(`Unknown mumbles subcommand: ${scmd}`)
      .then(console.log(`Unknown mumbles subcommand: ${scmd}`))
      .catch(console.error);
  }
}

eventBus.on("message", function(message){
  matchAndSendMumble(message);
});

eventBus.on("messageUpdate", function(oldMessage, newMessage) {
  matchAndSendMumble(newMessage);
});

exports.init = function(pluginName) {
  if (!CONFIG.mumblebox) {
    console.warn("<%s> Mumbles is not defined in config! No mumbles for match&talk", pluginName);
  }
  try {
    restoreIgnoreList();
    console.log("<" + pluginName + "> Restored ignore list. Ignored chatters: %s", ignoreList);
  } catch(err) {
    console.warn("<" + pluginName + "> Can't restore ignore list! %s", err);
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
    console.log(`Handle subcommand: ${tail} on #${message.channel.name} by ${message.author.username}`);
    execSubCommand(scmd, args, message);
  }
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
