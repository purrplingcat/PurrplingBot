import { Client, ClientOptions } from "discord.js"
import PurrplingBot from "@purrplingbot/core/PurrplingBot"
import { Commander } from "./core/Commander"
import FunfactCommand from "./commands/Funfact"
import HelpCommand from "./commands/Help"
import UptimeCommand from "./commands/Uptime"
import TimeCommand from "./commands/Time"
import TextCommandProvider, { TextCommand } from "@purrplingbot/providers/TextCommandProvider"

export type Config = {
  token: string;
  prefix?: string;
  discordClient?: ClientOptions;
  catwomanUid?: string;
  textCommands?: TextCommand[];
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
  commander.addCommand(new HelpCommand(commander));
  commander.addCommand(new UptimeCommand(client));
  commander.addCommand(new TimeCommand(config.catwomanUid || ""));
}

function registerProviders(commander: Commander, config: Config): void {
  commander.registerProvider(new TextCommandProvider(config.textCommands || []));
}

export function create(config: Config): PurrplingBotDIC {
  const client = new Client(config.discordClient)
  const commander = new Commander(config.prefix);
  const purrplingBot = new PurrplingBot(client, commander, config.token);

  registerProviders(commander, config);
  registerCommands(commander, client, config);

  return {
    version: "__BOT_VERSION__",
    codename: "__BOT_CODENAME__",
    purrplingBot,
  }
}
