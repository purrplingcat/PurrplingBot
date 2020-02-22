import { Client, Message } from "discord.js";
import { Commander } from "./core/Commander";
import { parseArgs, extractCommandName } from "./core/utils";
import FunfactCommand from "./commands/Funfact";
import NpcAdventuresCommand from "./commands/NpcAdventures";
import HelpCommand from "./commands/Help";
import UptimeCommand from "./commands/Uptime";
import SmapiCommand from "./commands/Smapi";

export default class PurrplingBot {
  readonly client: Client;
  readonly commander: Commander;
  private readonly token: string;

  constructor(client: Client, token: string) {
    this.client = client;
    this.token = token;
    this.commander = new Commander();

    this.client.on("ready", this.onReady.bind(this));
    this.client.on("message", this.onMessage.bind(this));
  }

  private onReady(): void {
    console.log(`Logged in as ${this.client.user?.tag}`);

    this.commander.register(new FunfactCommand());
    this.commander.register(new NpcAdventuresCommand());
    this.commander.register(new HelpCommand(this.commander));
    this.commander.register(new UptimeCommand(this.client));
    this.commander.register(new SmapiCommand());

    this.client.user?.setActivity({name: "Meow"});
  }

  private onMessage(message: Message): void {
    if (message.author === this.client.user || !message.content.startsWith("!")) {
      return;
    }

    const commandName = extractCommandName(message.content, this.commander.prefix)
    const command = this.commander.fetch(commandName);

    if (command == null) {
      message.reply("Unknown command.");
      return;
    }

    command.execute(message, parseArgs(message.content, this.commander.prefix));
  }

  public run(): void {
    this.client.login(this.token);
  }
}
