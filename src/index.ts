import { Client, ClientOptions } from "discord.js"
import PurrplingBot from "@purrplingbot/core/PurrplingBot"
import { Commander } from "./core/Commander"
import FunfactCommand from "./commands/Funfact"
import HelpCommand from "./commands/Help"
import UptimeCommand from "./commands/Uptime"
import TimeCommand from "./commands/Time"
import TextCommandProvider, { TextCommand } from "@purrplingbot/providers/TextCommandProvider"
import Auditor from "@purrplingbot/services/Auditor"
import MetricsProvider from "@purrplingbot/providers/Metrics"

export type Config = {
  token: string;
  prefix?: string;
  discordClient?: ClientOptions;
  catwomanUid?: string;
  textCommands?: TextCommand[];
  auditChannelId?: string;
}

/**
 * Dependecy injection container definition
 */
export interface BotRunner {
  version: string;
  codename: string;
  run(): void;
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

export function create(config: Config): BotRunner {
  const client = new Client(config.discordClient)
  const commander = new Commander(config.prefix);
  const auditor = new Auditor(client, config.auditChannelId || "");
  const purrplingBot = new PurrplingBot(client, commander, config.token);
  const metrics = new MetricsProvider(purrplingBot);

  registerProviders(commander, config);
  registerCommands(commander, client, config);

  auditor.init();

  return {
    version: "__BOT_VERSION__",
    codename: "__BOT_CODENAME__",
    run() {
      metrics.serve();
      purrplingBot.run();
    }
  }
}
