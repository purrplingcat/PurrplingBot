var PurrplingBot = require("../../purrplingbot.js");
var logger;

exports.commands = [
  "catsnack"
]

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
}

exports.catsnack = {
  "description": "Give a food to our cat",
  "exec": function(message) {
    var rand = Math.floor((Math.random() * 10) + 1);
    var msg = "";
    switch (rand) {
      case 1:
      msg = "Meow!";
      break;
      case 2:
      msg = "Yummy!";
      break;
      case 3:
      msg = "Tak málo? Pffft. Naval ještě, " + message.author + "!";
      break;
      case 4:
      msg = "Granule? To žrát nebudu, já chci kapsičku s tuňákem!";
      break;
      case 5:
      msg = "*vyžírá misku jak zběsilá*";
      break;
      case 6:
      msg = "Purrrrrrrrrrrrrrr.....";
      break;
      case 7:
      msg = "JSEM Z VENUŠE A GRANULE JSOU POD MOJÍ ÚROVEŇ !!!";
      break;
      case 8:
      msg = "https://memeyourfriends.com/wp-content/uploads/2016/09/hungry-cat-ate-all-my-loaf.jpg"
      break;
      default:
      msg = "Díky, mňauky!";
    }
    message.channel.send(msg)
    .then(logger.log(`I got food from ${message.author.username} in #${message.channel.name} (Answer index: ${rand})`))
    .catch(logger.error);
  }
};

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
