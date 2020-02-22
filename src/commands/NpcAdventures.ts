import { Command } from "@purrplingbot/core/Commander";
import { Message } from "discord.js";

export default class NpcAdventuresCommand implements Command {
  name = "npcadventures";  
  description = "Are you confused about NPC Adventures?";
  aliases?: string[] = ["npcadventure", "na", "shitmod"];
  usage?: string | undefined;
  subcommands?: Command[] | undefined;

  execute(message: Message): void {
    message.channel.send(
      "NPC Adventures (or NA or \"It's time to adventure\") " +
      "is a SDV mod which allows villagers go to an adventure with you." + 
      "Also adds adventuring with companions.\n\n" + 
      "https://www.nexusmods.com/stardewvalley/mods/4582"
    );
  }
}
