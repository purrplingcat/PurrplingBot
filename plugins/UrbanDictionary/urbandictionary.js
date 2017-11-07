var request = require("request");
var PurrplingBot = require("../../purrplingbot.js");
var logger;

exports.commands = [
  "urban"
];

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
}

function fetchAndSendUrbanDefinition(message, term, n = 1) {
  var request_url = "http://api.urbandictionary.com/v0/define?term=" + term;
  logger.log("Request url: " + request_url + "\tterm: " + term);
  message.channel.startTyping();
  request({
    url: request_url,
    json: true,
  }, function (error, response, body) {
    var result = null;
    message.channel.stopTyping();
    if (!error && response.statusCode === 200 && body) {
      if (body.result_type != "no_results") {
        if (n < 1 || n > body.list.length) {
          logger.info("Page is out of range: %s term: %s", n, term);
          result = "Page is out of range: " + n;
        }
        var phrase = body.list[n-1];
        if (phrase) result = `**${term} (${n}/${body.list.length})** - ${phrase.definition}\n\n_„${phrase.example}“_\n\n${phrase.permalink}`;
        else logger.warn("Result is empty for term: %s page: %s", term, n);
      } else result = "Nothing found for term: " + term;
    }
    if (result === null) {
      result = "Something is wrong! I'm really sorry :crying_cat_face:";
      logger.warn("An error occured while get request. Status code: " + response.statusCode);
    }
    message.channel.stopTyping();
    message.channel.send(result, {embed: {url: null}})
    .then(logger.info(`URBAN DEFINITION SENT!\tterm: ${term} page: ${n}`))
    .catch(logger.error);
  });
}

exports.urban = {
  "description": "Get a funny cat!",
  "exec": function(message, tail) {
    if (!tail) {
      message.reply("Please tell me a word and I find their definition on Urban Dictionary");
      return;
    }
    var [term, page] = tail.split(' ');
    fetchAndSendUrbanDefinition(message, term, page);
  }
};

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
