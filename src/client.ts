import { Client, Message } from "discord.js";
import { Commander } from "./core/Commander";
import { parseArgs } from "./core/utils";
import FunfactCommand from "./commands/Funfact";
import NpcAdventuresCommand from "./commands/NpcAdventures";
import HelpCommand from "./commands/Help";

export function registerHooks(client: Client): void {
  const commander = new Commander();

  client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);

    commander.register(new FunfactCommand());
    commander.register(new NpcAdventuresCommand());
    commander.register(new HelpCommand(commander));

    client.user?.setActivity({name: "Meow"});
  });
  
  client.on("message", (message: Message) => {
    if (message.author === client.user || !message.content.startsWith("!")) {
      return;
    }

    const command = commander.fetch(message);

    if (command == null) {
      message.reply("Unknown command.");
      return;
    }

    command.execute(message, parseArgs(message.content));
  });
}
