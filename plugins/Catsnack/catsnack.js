var PurrplingBot = require("../../purrplingbot.js");
var CONFIG = PurrplingBot.getConfiguration();
var logger;

const catsnackConf = CONFIG.catsnack || {};

var overfeedThreshold;
var overfeedDiscount;
var overfeeded = false;
var mumbles;

exports.commands = [
  "catsnack"
]

function healKitty() {
  if (overfeeded || overfeedDiscount != overfeedThreshold) {
    if (overfeeded) {
      PurrplingBot.logEvent(`Kitty's overfeed gone (overfeed heal)`, "Kitty:Overfeed");
    }
    overfeedDiscount = overfeedThreshold;
    overfeeded = false;
    logger.info("Kitty overfeed healed!");
    logger.log("Overfeed discount: %s", overfeedDiscount);
  }
}

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
  overfeedThreshold = catsnackConf.overfeedThreshold || 20;
  overfeedDiscount = overfeedThreshold;

  mumbles = catsnackConf.mumbles || [
    "Meow",
    "Pffft, Bleh!",
    "I want meat! I don't eat granules! I AM LADY, DUDE!",
    "Purrrrrrr",
    "Tuna?? I love tuna!!",
    "Chew, chew"
  ];

  const TIMEOUT = catsnackConf.overfeedTimeout || 60; // Overfeed timeout
  const FSB = catsnackConf.overfeedFSB || 4; // Regular heal FSB
  setInterval(healKitty, TIMEOUT * FSB * 1000);
}

exports.status = function() {
  return {
    "mumblesCount": mumbles.length,
    "overfeedDiscount": overfeedDiscount,
    "overfeedThreshold": overfeedThreshold,
    "overfeeded": overfeeded,
    "overfeedTimeout": catsnackConf.overfeedTimeout || 60,
    "overfeedFSB": catsnackConf.overfeedFSB || 4
  }
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
      PurrplingBot.logEvent(`Kitty getting overfeed for ${TIMEOUT} seconds`, "Kitty:Overfeed");
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
    var rand = Math.floor((Math.random() * catsnackConf.notOccureIndex || 10) + 1);
    var msg = "";
    if (mumbles[rand]) msg = mumbles[rand];
    else msg = catsnackConf.defaultMumble || "Meow! Thanks!";
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
