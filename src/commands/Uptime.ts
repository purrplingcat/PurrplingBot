import { Command } from "@purrplingbot/core/Commander";
import { Message, Client } from "discord.js";
import { formatDistanceToNow } from "date-fns";

export default class UptimeCommand implements Command {
  name = "uptime";  
  direct = true;
  description = "How long is PurrplingBot alive?";
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  execute(message: Message): void {
    const uptime = this.client.readyAt;

    if (uptime == null) {
      console.log("PurrplingBot not running!");
      return;
    }

    message.channel.send(`PurrplingBot started a ${formatDistanceToNow(uptime)} ago.`);
  }
}
