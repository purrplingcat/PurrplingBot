import { Message } from "discord.js";
import { extractCommandName, parseArgs } from "@purrplingbot/core/utils";
import CommandProvider from "@purrplingbot/core/CommandProvider";
import { Gauge } from "prom-client";

export interface Command {
  name: string;
  direct: boolean;
  description?: string;
  aliases?: string[];
  usage?: string;
  subcommands?: Command[];
  execute(message: Message, args?: string[]): void;
}

export class Commander {
  private readonly registry: Command[] = [];
  private readonly providers: CommandProvider[] = [];
  private readonly replyOnUnknown: boolean;
  private readonly execCommandMetrics: Gauge<"type">;
  public readonly prefix: string;

  constructor(prefix?: string, replyOnUnknown = true) {
    this.prefix = prefix ?? "!";
    this.replyOnUnknown = replyOnUnknown;
    this.execCommandMetrics = new Gauge({
      name: "purrplingbot_commander_command_exec_count",
      help: "Commander metrics",
      labelNames: ["type"]
    })
  }

  getCommands(): Command[] {
    return Array.from(this.registry)
      .concat(...this.providers.map(provider => provider.getCommands()));
  }

  fetch(commandName: string): Command | null {
    // Try provide this command by any provider
    for (const provider of this.providers) {
      const command = provider.provide(commandName);

      if (command != null) {
        return command;
      }
    }

    // If no command provided, then try to find them in default registry
    return this.registry.find(
      (command) => (command.name === commandName && command.direct) || command.aliases?.includes(commandName)
    ) || null;
  }

  addCommand(command: Command): void {
    if (this.registry.find(cmd => cmd.name === command.name)) {
      throw new Error(`Command '${command.name}' was already registered`);
    }

    this.registry.push(command);
  }

  registerProvider(provider: CommandProvider): void {
    this.providers.push(provider);
  }

  isCommand(message: Message): boolean {
    return message.content.startsWith(this.prefix);
  }

  process(message: Message): void {
    const commandName = extractCommandName(message.content, this.prefix)
    const command = this.fetch(commandName);

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
