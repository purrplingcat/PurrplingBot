import { Client, ClientOptions } from "discord.js"
import { registerHooks } from "@purrplingbot/client"

type Config = {
  token: string;
  discordClient?: ClientOptions;
}

interface PurrplingBot {
  run(): void;
}

export function create(config: Config): PurrplingBot {
  const client = new Client(config.discordClient)

  registerHooks(client);

  return {
    run(): void {
      client.login(config.token);
    }
  }
}
