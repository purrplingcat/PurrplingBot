import { Client, Message } from "discord.js";
import { Commander } from "@purrplingbot/core/Commander";
import FunfactCommand from "@purrplingbot/commands/Funfact";
import NpcAdventuresCommand from "@purrplingbot/commands/NpcAdventures";
import HelpCommand from "@purrplingbot/commands/Help";
import UptimeCommand from "@purrplingbot/commands/Uptime";
import SmapiCommand from "@purrplingbot/commands/Smapi";

export default class PurrplingBot {
  readonly client: Client;
  readonly commander: Commander;
  private readonly token: string;

  constructor(client: Client, commander: Commander, token: string) {
    this.client = client;
    this.token = token;
    this.commander = commander;

    this.client.on("ready", this.onReady.bind(this));
    this.client.on("message", this.onMessage.bind(this));
  }

  private async onReady(): Promise<void> {
    console.log(`Logged in as ${this.client.user?.tag}`);

    this.commander.register(new FunfactCommand());
    this.commander.register(new NpcAdventuresCommand());
    this.commander.register(new HelpCommand(this.commander));
    this.commander.register(new UptimeCommand(this.client));
    this.commander.register(new SmapiCommand());

    this.client.user?.setActivity({name: "Meow"});
  }

  private onMessage(message: Message): void {
    if (message.author === this.client.user) {
      return; // ignore own messages
    }

    if (this.commander.isCommand(message)) {
      this.commander.process(message);
    }    
  }

  public run(): void {
    this.client.login(this.token);
  }
}
