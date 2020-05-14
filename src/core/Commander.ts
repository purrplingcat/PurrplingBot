import { Message } from "discord.js";
import { extractCommandName, parseArgs } from "@purrplingbot/core/utils";
import CommandProvider from "@purrplingbot/core/CommandProvider";
import { Gauge } from "prom-client";
import { injectable, inject } from "inversify";
import types from "@purrplingbot/types";

export interface Command {
  name: string;
  direct: boolean;
  description?: string;
  aliases?: string[];
  usage?: string;
  subcommands?: Command[];
  execute(message: Message, args?: string[]): void;
}

@injectable()
export class Commander {
  private readonly providers: CommandProvider[] = [];
  private readonly replyOnUnknown: boolean;
  private readonly execCommandMetrics: Gauge<"type">;
  public readonly prefix: string;

  public static TYPE = Symbol.for("Commander");

  constructor(
    @inject(types.Prefix) prefix: string
  ) {
    this.prefix = prefix ?? "!";
    this.replyOnUnknown = true;
    this.execCommandMetrics = new Gauge({
      name: "purrplingbot_commander_command_exec_count",
      help: "Commander metrics",
      labelNames: ["type"]
    })
  }

  async getCommands(): Promise<Command[]> {
    const commands = await Promise.all(this.providers.map(async (provider) => await provider.getCommands()));

    return Array<Command>().concat(
      ...commands
    );
  }

  async fetch(commandName: string): Promise<Command | null> {
    // Try provide this command by any provider
    for (const provider of this.providers) {
      const command = await provider.provide(commandName);

      if (command != null) {
        return command;
      }
    }

    return null;
  }

  registerProviders(...providers: CommandProvider[]): void {
    
    for (const provider of providers) {
      if (this.providers.find(p => p.name === provider.name) == null) {
        this.providers.push(provider);
      }
    }
  }

  isCommand(message: Message): boolean {
    return message.content.startsWith(this.prefix);
  }

  async process(message: Message): Promise<void> {
    const commandName = extractCommandName(message.content, this.prefix)
    const command = await this.fetch(commandName);

    this.execCommandMetrics.inc({ type: "total" });

    if (command == null) {
      if (this.replyOnUnknown) {
        message.reply("Unknown command.");
      }

      this.execCommandMetrics.inc({ type: "unknown" });
      return;
    }

    this.execCommandMetrics.inc({ type: "executed" });
    command.execute(message, parseArgs(message.content, this.prefix));
  }
}
