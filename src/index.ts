import { Client, ClientOptions, Intents } from "discord.js"
import mongoose from 'mongoose';
import PurrplingBot from "@purrplingbot/core/PurrplingBot"
import { Commander } from "./core/Commander"
import FunfactCommand from "./commands/Funfact"
import HelpCommand from "./commands/Help"
import UptimeCommand from "./commands/Uptime"
import TimeCommand from "./commands/Time"
import TextCommandProvider, { TextCommand } from "@purrplingbot/providers/TextCommandProvider"
import Auditor from "@purrplingbot/services/Auditor"
import MetricsProvider from "@purrplingbot/providers/MetricsProvider"
import * as logger from "@purrplingbot/utils/logger";
import RankSystem, { RankConfig } from "@purrplingbot/services/RankSystem";
import RankRole from "@purrplingbot/models/rankRole";

export type Config = {
  token: string;
  prefix?: string;
  mongoUri: string;
  discordClient?: ClientOptions;
  catwomanUid?: string;
  textCommands?: TextCommand[];
  auditChannelId?: string;
  ranks: RankConfig;
}

/**
 * Dependecy injection container definition
 */
export interface Bootstrap {
  run(): void;
}

const intents = new Intents([
  Intents.NON_PRIVILEGED,
  "GUILD_MEMBERS"
]);

function registerCommands(commander: Commander, client: Client, config: Config): void {
  commander.addCommand(new FunfactCommand());
  commander.addCommand(new HelpCommand(commander));
  commander.addCommand(new UptimeCommand(client));
  commander.addCommand(new TimeCommand(config.catwomanUid || ""));
}

export const VERSION = "__BOT_VERSION__";
export const CODENAME = "__BOT_CODENAME__";
export function create(config: Config): Bootstrap {
  const client = new Client({ ...config.discordClient, ws: { intents }})
  const commander = new Commander(config.prefix);
  const auditor = new Auditor(client, config.auditChannelId || "");
  const purrplingBot = new PurrplingBot(client, commander, config.token);
  const metrics = new MetricsProvider(purrplingBot);
  const ranks = new RankSystem(purrplingBot, config.ranks);

  mongoose.connection.on('connected', () => {
    logger.ready('Mongoose connection successfully opened');
  });
  mongoose.connection.on('err', (err) => {
    logger.error(`Mongoose connection error: \n ${err.stack}`);
  });
  mongoose.connection.on('disconnected', () => {
    logger.error('Mongoose disconnected');
  });

  commander.registerProvider(new TextCommandProvider(config.textCommands || []));
  registerCommands(commander, client, config);
  auditor.init();
  ranks.init();

  return {
    run(): void {
      metrics.serve();
      mongoose.connect(config.mongoUri, {useNewUrlParser: true, useUnifiedTopology: true});
      purrplingBot.run();
    }
  }
}
