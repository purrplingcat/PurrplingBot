import { Client, ClientOptions } from "discord.js"
import PurrplingBot from "@purrplingbot/client"

type Config = {
  token: string;
  discordClient?: ClientOptions;
}

interface BotRunner {
  version: string;
  codename: string;
  run(): void;
}

export function create(config: Config): BotRunner {
  const client = new Client(config.discordClient)
  const purrplingBot = new PurrplingBot(client, config.token);

  return {
    version: "__BOT_VERSION__",
    codename: "__BOT_CODENAME__",
    run(): void {
      purrplingBot.run();
    }
  }
}
