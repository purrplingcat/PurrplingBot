const PurrplingBot = require("../../purrplingbot.js");
const SimpleCommand = require("../../common/commands/simpleCommand");
const numbers = [
  ':one:',
  ':two:',
  ':three:',
  ':four:',
  ':five:',
  ':six:',
  ':seven:',
  ':eight:',
  ':nine:',
  ':keycap_ten:'
];
var logger;

exports.commands = [
  "poll"
];

exports.init = function(pluginName) {
  logger = PurrplingBot.createLogger(pluginName);
};

function execPoll(cmdMessage) {
  if (cmdMessage.args.length < 2) {
    cmdMessage.reply("Give a question with one or more choices!")
    .then(logger.info("Can't start a poll - No question or choices given!"))
    .catch(logger.error);
    return;
  }
  let question = cmdMessage.args.shift();
  let choices = cmdMessage.args;
  let text = "QUESTION: **" + question + "**\n\n";
  for (var i = 0, len = choices.length; i < len; i++) {
    let number = numbers[i];
    let choice = choices[i];
    if (!number) {
      logger.log("Over the choice maximmum!");
      break;
    }
    text += number + " - " + choice + "\n";
  }
  text += "\nReact this message by emoji for vote a choice!";
  cmdMessage.channel.send(text)
    .then(logger.info("Poll created and send! Question: '%s' Choices count: %s", question, choices.length))
    .catch(logger.error);
}

exports.poll = new SimpleCommand(execPoll, PurrplingBot.Commander)
  .setDescription("Start a poll question and vote choice! Max choices is 10")
  .setUsage("<question> <choice1> [<choice2> ...]");

// Avoid plugin run standalone
if (require.main === module) {
  console.error("This plugin cannot be run standalone! Run 'node purrplingbot.js' instead.");
  process.exit(1);
}
