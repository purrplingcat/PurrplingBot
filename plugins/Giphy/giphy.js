var request = require("request");
var PurrplingBot = require("../../purrplingbot.js");
var logger;

const API_KEY = "dc6zaTOxFJmzC";
const TYPE_GIF = "gifs"
const TYPE_STICKER = "stickers"

exports.commands = [
  "giphy",
  "sticker"
];

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
}

function fetchAndSendMyGif(message, tag, type) {
  var request_url = `http://api.giphy.com/v1/${type}/random?api_key=${API_KEY}&tag=${tag}`;
  logger.log("Request url: " + request_url + "\ttag: " + tag);
  request({
    url: request_url,
    json: true,
  }, function (error, response, body) {
    var result = null;
    if (!error && response.statusCode === 200) {
      result = body.data.url;
    }
    if (result === null) {
      result = "Je mi líto, ale něco se rozbilo. Zkus to prosím později.";
      logger.warn("An error occured while get request. Status code: " + response.statusCode);
    }
    message.channel.send(result)
    .then(logger.log(`GIF SENT! result: ${result}\ttag: ${tag}\t type: ${type}`))
    .catch(logger.error);
  });
}

function executeSearch(message, tail, type) {
  logger.dir(tail);
  if (tail && tail.length > 0) {
    fetchAndSendMyGif(message, tail, type);
    return;
  }
  message.reply("Tell me, what I have to search on Giphy.")
  .then(logger.log(`No keyword/tag specified. User: ${message.author.username} in #${message.channel.name}`))
  .catch(logger.error);
}

exports.giphy = {
  "description": "Get a random gif from giphy.com by your keyword",
  "usage": "<keyword>",
  "exec": function (message, tail) {
    executeSearch(message, tail, TYPE_GIF);
  }
};

exports.sticker = {
  "description": "Get a random sticker from giphy.com by your keyword",
  "usage": "<keyword>",
  "exec": function (message, tail) {
    executeSearch(message, tail, TYPE_STICKER);
  }
};

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
