var request = require("request");

exports.commands = [
  "meow",
  "hwaii"
];

function fetchAndSendMyGif(message, tag) {
  var request_url = "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=" + tag;
  console.log("Request url: " + request_url + "\ttag: " + tag);
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
      console.warn("An error occured while get request. Status code: " + response.statusCode);
    }
    message.channel.send(result)
    .then(console.log(`GIF SENT! result: ${result}\ttag: ${tag}`))
    .catch(console.error);
  });
}

exports.meow = {
  "description": "Get a funny cat!",
  "exec": function(message) {
    fetchAndSendMyGif(message, "cat");
  }
};

exports.hwaii = {
  "description": "Get a funny fox!",
  "exec": function(message) {
    fetchAndSendMyGif(message, "cute+fox");
  }
};
