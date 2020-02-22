import { Command } from "@purrplingbot/core/Commander";
import { Message } from "discord.js";

export default class SmapiCommand implements Command {
  name = "log";  
  description = "How about SMAPI logs?";

  execute(message: Message): void {
    message.channel.send("If you want report something or need a help, please upload your log here: https://smapi.io/log and share link on your uploaded log here.");
  }
}
