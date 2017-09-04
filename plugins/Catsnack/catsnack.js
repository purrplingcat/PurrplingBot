var PurrplingBot = require("../../purrplingbot.js");
var CONFIG = PurrplingBot.getConfiguration();
var logger;

const catsnackConf = CONFIG.catsnack || {};

var overfeedThreshold;
var overfeedDiscount;
var overfeeded = false;

exports.commands = [
  "catsnack"
]

function healKitty() {
  overfeedDiscount = overfeedThreshold;
  overfeeded = false;
  logger.info("Kitty overfeed healed!");
  logger.log("Overfeed discount: %s", overfeedDiscount);
}

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  overfeedThreshold = catsnackConf.overfeedThreshold || 20;
  overfeedDiscount = overfeedThreshold;

  const TIMEOUT = catsnackConf.overfeedTimeout || 60; // Overfeed timeout
  const FSB = catsnackConf.overfeedFSB || 4; // Regular heal FSB
  setInterval(healKitty, TIMEOUT * FSB * 1000);
}

exports.catsnack = {
  "description": "Give a food to our cat",
  "exec": function(message) {
    if (!overfeedDiscount) {
      overfeeded = true;
      overfeedDiscount = overfeedThreshold;
      const TIMEOUT = catsnackConf.overfeedTimeout || 60; // Post-Overfeed timeout
      setTimeout(healKitty, TIMEOUT * 1000);
      logger.info("Kitty getting overfeed for %s seconds", TIMEOUT);
    }
    if (overfeeded) {
      message.reply("Jsem přežraná, neotravuj!", {
        embed: {
          title: "RAAAAAAAINBOOOOOOOOOW",
          image: {
            url: "http://wonkville.net/wp-content/uploads/2016/02/Cat-Vomit-animated-puke_rainbows__by_mariannamiledy-d51d4vo.gif"
          }
        }
      })
      .then(logger.info("Kitty is overfeeded!"));
      return;
    } else overfeedDiscount--;
    logger.log("Overfeed discount: %s", overfeedDiscount);
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
    .then(logger.info(`I got food from ${message.author.username} in #${message.channel.name} (Answer index: ${rand})`))
    .catch(logger.error);
  }
};

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
