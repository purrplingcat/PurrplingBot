import { ICommand } from "@purrplingbot/core/Commander";
import { Message } from "discord.js";

export default class FunfactCommand implements ICommand {
  name: string = "funfact";  
  description: string = "Get a funfact about PurrplingCat's modding, streaming or about something what she's doing.";
  aliases?: string[] = ["fact"];
  usage?: string | undefined;
  subcommands?: ICommand[] | undefined;

  private facts: string[] = [
    "Did you know that the main contribution and development team for NPC Adventures are all women? :female_sign::blush:"
  ];

  execute(message: Message): void {
    const which = Math.trunc(Math.random() * this.facts.length);

    message.channel.send(this.facts[which]);
  }
}
