import { Command } from "@purrplingbot/core/Commander";
import { Message } from "discord.js";

export default class FunfactCommand implements Command {
  name = "funfact";  
  visible = true;
  description = "Get a funfact about PurrplingCat's modding, streaming or about something what she's doing.";
  aliases?: string[] = ["fact"];
  usage?: string | undefined;
  subcommands?: Command[] | undefined;

  private facts: string[] = [
    "Did you know that the main contribution and development team for NPC Adventures are all women? :female_sign::blush:"
  ];

  execute(message: Message): void {
    const which = Math.trunc(Math.random() * this.facts.length);

    message.channel.send(this.facts[which]);
  }
}
