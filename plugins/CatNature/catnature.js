var PurrplingBot = require("../../purrplingbot.js");
var CONFIG = PurrplingBot.getConfiguration();
var logger;

const catsnackConf = CONFIG.catsnack || {};

const CAT_CUDDLES = "cuddles";
const CAT_SCRATCHES = "scratches";
const CAT_ANGRYCAT = "angrycat";
const CAT_HUNT = "hunt";

var nature;

exports.commands = [
  "cuddle",
  "scratch",
  "angrycat",
  "hunt"
]

function defaultCatNature() {
  return {
    "cuddles": [],
    "scratches": [],
    "angrycat": [],
    "hunt": []
  }
}

function do_mischief(category, prey) {
  var malice = nature[category];
  if (!malice) return null;
  var rand = Math.floor((Math.random() * malice.length-1) + 1);
  logger.log("Take a number: %s", rand);
  return malice[rand].replace("%prey%", prey);
}

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  nature = CONFIG.catnature || defaultCatNature();
}

exports.status = function() {
  return {
  }
}

exports.cuddle = {
  "description": "Pet our kittybot",
  "exec": function(message) {
    var content = do_mischief(CAT_CUDDLES, message.author);
    message.channel.send(content)
    .then(logger.info("Sent a cuddle: %s to #%s requested by: %s"), content, message.channel.name, message.author.username);
  }
};

exports.scratch = {
  "description": "Tell cat, what do scratching or who",
  "usage": "[<user/thing>]",
  "exec": function(message) {
    if (!tail) tail = message.author;
    var content = do_mischief(CAT_SCRATCHES, tail);
    message.channel.send(content)
    .then(logger.info("Sent a cuddle: %s to #%s requested by: %s"), content, message.channel.name, message.author.username);
  }
};

exports.angrycat = {
  "description": "ARRRRRRGHHHHHH!!!!!",
  "usage": "[<user/thing>]",
  "exec": function(message) {
    if (!tail) tail = message.author;
    var content = do_mischief(CAT_ANGRYCAT, tail);
    message.channel.send(content)
    .then(logger.info("Sent a cuddle: %s to #%s requested by: %s"), content, message.channel.name, message.author.username);
  }
};

exports.hunt = {
  "description": "Give a food to our cat",
  "usage": "[<user/thing>]",
  "exec": function(message) {
    if (!tail) tail = message.author;
    var content = do_mischief(CAT_HUNT, tail);
    message.channel.send(content)
    .then(logger.info("Sent a cuddle: %s to #%s requested by: %s"), content, message.channel.name, message.author.username);
  }
};

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
