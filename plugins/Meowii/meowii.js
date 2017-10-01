const request = require("request");
const PurrplingBot = require("../../purrplingbot.js");
const SimpleCommand = require("../../common/commands/simpleCommand");
var logger;

exports.commands = [
  "meow",
  "hwaii"
];

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
}

function fetchAndSendMyGif(cmdMessage, tag) {
  var request_url = "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=" + tag;
  logger.log("Request url: " + request_url + "\ttag: " + tag);
  cmdMessage.channel.startTyping();
  request({
    url: request_url,
    json: true,
  }, function (error, response, body) {
    var result = null;
    cmdMessage.channel.stopTyping();
    if (!error && response.statusCode === 200) {
      result = body.data.url;
    }
    if (result === null) {
      result = "Je mi líto, ale něco se rozbilo. Zkus to prosím později.";
      logger.warn("An error occured while get request. Status code: " + response.statusCode);
    }
    cmdMessage.channel.send(result)
    .then(logger.info(`GIF SENT! result: ${result}\ttag: ${tag}`))
    .catch(logger.error);
  });
}

exports.meow = new SimpleCommand(function(cmdMessage) {
  fetchAndSendMyGif(cmdMessage, "cat");
}, PurrplingBot.Commander)
  .setDescription("Get a funny cat!");

exports.hwaii = new SimpleCommand(function(cmdMessage) {
  fetchAndSendMyGif(cmdMessage, "cute+fox");
}, PurrplingBot.Commander)
  .setDescription("Get a funny fox!");

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
