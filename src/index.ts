import { Client, ClientOptions } from "discord.js"
import PurrplingBot from "@purrplingbot/core/PurrplingBot"
import { Commander } from "./core/Commander"
import FunfactCommand from "./commands/Funfact"
import NpcAdventuresCommand from "./commands/NpcAdventures"
import HelpCommand from "./commands/Help"
import UptimeCommand from "./commands/Uptime"
import SmapiCommand from "./commands/Smapi"
import TimeCommand from "./commands/Time"

export type Config = {
  token: string;
  prefix?: string;
  discordClient?: ClientOptions;
  catwomanUid?: string;
}

/**
 * Dependecy injection container definition
 */
export interface PurrplingBotDIC {
  version: string;
  codename: string;
  purrplingBot: PurrplingBot;
}

function registerCommands(commander: Commander, client: Client, config: Config): void {
  commander.addCommand(new FunfactCommand());
  commander.addCommand(new NpcAdventuresCommand());
  commander.addCommand(new HelpCommand(commander));
  commander.addCommand(new UptimeCommand(client));
  commander.addCommand(new SmapiCommand());
  commander.addCommand(new TimeCommand(config.catwomanUid || ""));
}

export function create(config: Config): PurrplingBotDIC {
  const client = new Client(config.discordClient)
  const commander = new Commander(config.prefix);
  const purrplingBot = new PurrplingBot(client, commander, config.token);

  registerCommands(commander, client, config);

  return {
    version: "__BOT_VERSION__",
    codename: "__BOT_CODENAME__",
    purrplingBot,
  }
}
