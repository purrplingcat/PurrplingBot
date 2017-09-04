var PurrplingBot = require("../../purrplingbot.js");
var eventBus = PurrplingBot.getEventBus(); // Use PurrplingBot.on() directly after merge pull reuest #79 (implements issue #76)
var config = PurrplingBot.getConfiguration();
var store = PurrplingBot.getStore();
var logger;

const STORE = "wordcounter";
const MSG_SAVE_COUNT = 10;

var discountToSave = MSG_SAVE_COUNT;

/*
 * DATA SCHEMA
 * {<guildId>:{<userID>: {words: int, messages: int}}}
 * TODO: Write saving stats (after merge pull request #77)
 */
var counterStore = {};

exports.commands = [
  "words",
  "messages"
]

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  logger.info("Restore wordcounter data");
  counterStore = store.restoreScope(STORE);
}

// Exclude this function to ../../lib/utils.js (issue #72)
function parseUserlID(userSlug) {
  if (userSlug.startsWith("<@")) {
    return userSlug.substr(2, userSlug.length - 3);
  }
  return userSlug;
}

function fetchUserGuildStats(guildId, userId) {
  if (!counterStore[guildId]) counterStore[guildId] = {};
  if (!counterStore[guildId][userId]) counterStore[guildId][userId] = {words: 0, messages: 0};
  //logger.dir(counterStore);
  return counterStore[guildId][userId];
}

function printStats(message, user, type) {
  if (!user) {
    user = message.author.id;
    logger.info(`User no specified! Using message author ${message.author.username}`);
  }
  var userID = parseUserlID(user);
  var member = message.guild.members.find('id', userID);
  if (!member) {
    member = message.guild.members.find('displayName', userID);
  }
  if (!member) {
    message.reply("Sorry, I don't know this member")
    .catch(logger.error);
    logger.info(`Unknown user ${userID} - Info sent to #${message.channel.name} requested by ${message.author.username}`);
    return;
  }
  if (!counterStore[message.guild.id]) counterStore[message.guild.id] = {}; // Protect fail if unknown guild!
  if (!counterStore[message.guild.id][member.id]) {
    message.channel.send("This user has'nt spoken yet")
    .catch(logger.error);
    logger.info(`Sent ${type} stats of user ${member.user.username} to #${message.channel.name} requested by ${message.author.username}`);
  } else {
    var stats = fetchUserGuildStats(message.guild.id, member.id);
    if (type == "words") {
      message.channel.send(`User ${member} wrote ${stats.words} words.`)
      .catch(logger.error);
    }
    if (type == "messages") {
      message.channel.send(`User ${member} sent ${stats.messages} messages.`)
      .catch(logger.error);
    }
    logger.info(`Sent ${type} stats of user ${member.user.username} to #${message.channel.name} requested by ${message.author.username}`);
  }
}

eventBus.on("message", function(message) {
  var guildId = message.guild.id;
  var userId = message.author.id;
  var words = message.content.split(' ').length || 0;
  var usersStats = fetchUserGuildStats(guildId, userId);

  // Increment a counters
  usersStats.words += words;
  usersStats.messages++;

  // Store wordcounter (without saving. Will be saved by interval)
  store.storeScope(STORE, counterStore);
  if (!discountToSave) {
    logger.info("Save discount expired! Store wordcounter to storage.");
    store.flush();
    discountToSave = MSG_SAVE_COUNT;
  } else {
    discountToSave--;
    logger.log("Save discount: %s", discountToSave);
  }
});

exports.words = {
  "description": "Get a user's word count",
  "usage": "<user>",
  "exec": function(message, tail) {
    printStats(message, tail, "words");
  }
}

exports.messages = {
  "description": "Get a user's messages count",
  "usage": "<user>",
  "exec": function(message, tail) {
    printStats(message, tail, "messages");
  }
}

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
