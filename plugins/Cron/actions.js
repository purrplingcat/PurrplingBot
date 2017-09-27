const Action = require("./action");
const PurrplingBot = require("../../purrplingbot");
var client = PurrplingBot.DiscordClient;

function registerDefaultActions(actions, logger) {
  actions.set('sendMessage', new SendMessage(logger));
}

class SendMessage extends Action {
  exec(name, args) {
    var [ channelID, message ] = args;
    var channel = client.channels.find('id', channelID);
    if (!channel) {
      this.logger.error("Can't send message - Channel not found! ID: %s", channelID);
      return;
    }
    channel.send(message)
    .then(this.logger.log("Message sent to #%s", channel.name))
    .catch(this.logger.error);
  }
}

module.exports = registerDefaultActions;
