const Action = require("./action");
const PurrplingBot = require("../../purrplingbot");
var client = PurrplingBot.DiscordClient;

function registerDefaultActions(actions, logger) {
  actions.set('sendMessage', new SendMessage(logger));
  actions.set('changeAvatar', new ChangeAvatar(logger));
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
    .then(this.logger.info("Message sent to #%s", channel.name))
    .catch(this.logger.error);
  }
}

class ChangeAvatar extends Action {
  exec(name, args) {
    var [ avatar ] = args;
    if (!avatar) {
      this.logger.error("Cant' change avatar to empty or null");
      return;
    }
    client.user.setAvatar(avatar)
    .then(this.logger.info("Changed bot's avatar to: %s", avatar))
    .catch(this.logger.error);
  }
}

module.exports = registerDefaultActions;
