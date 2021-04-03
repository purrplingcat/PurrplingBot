import { Command } from "@purrplingbot/core/Commander";
import { Message, Client } from "discord.js";
import { formatDistanceToNow } from "date-fns";
import { warn } from "@purrplingbot/utils/logger";

export default class UptimeCommand implements Command {
  name = "uptime";  
  visible = true;
  description = "How long is PurrplingBot alive?";
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  execute(message: Message): void {
    const uptime = this.client.readyAt;

    if (uptime == null) {
      warn("PurrplingBot not running!");
      return;
    }

    message.channel.send(`PurrplingBot started a ${formatDistanceToNow(uptime)} ago.`);
  }
}
