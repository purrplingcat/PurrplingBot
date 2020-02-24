import { Client, ClientOptions } from "discord.js"
import PurrplingBot from "@purrplingbot/core/PurrplingBot"
import { Commander } from "./core/Commander"

type Config = {
  token: string;
  prefix?: string;
  discordClient?: ClientOptions;
}

/**
 * Dependecy injection container definition
 */
interface PurrplingBotDIC {
  version: string;
  codename: string;
  purrplingBot: PurrplingBot;
}

export function create(config: Config): PurrplingBotDIC {
  const client = new Client(config.discordClient)
  const commander = new Commander(config.prefix);
  const purrplingBot = new PurrplingBot(client, commander, config.token);

  return {
    version: "__BOT_VERSION__",
    codename: "__BOT_CODENAME__",
    purrplingBot,
  }
}
