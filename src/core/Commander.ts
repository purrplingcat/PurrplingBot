import { Message } from "discord.js";
import { extractCommandName, parseArgs } from "./utils";

export interface Command {
  name: string;
  description?: string;
  aliases?: string[];
  usage?: string;
  subcommands?: Command[];
  execute(message: Message, args?: string[]): void;
}

export class Commander {
  private readonly registry: Command[] = [];
  public readonly prefix: string = "!";

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix ?? "!";
    }
  }

  getCommands(): Command[] {
    return Array.from(this.registry);
  }

  fetch(commandName: string): Command | null {
    return this.registry.find(
      (command) => command.name === commandName || command.aliases?.includes(commandName)
    ) || null;
  }

  register(command: Command): void {
    if (this.registry.find(cmd => cmd.name === command.name)) {
      throw new Error(`Command '${command.name}' was already registered`);
    }

    this.registry.push(command);
  }

  isCommand(message: Message): boolean {
    return message.content.startsWith(this.prefix);
  }

  process(message: Message): void {
    const commandName = extractCommandName(message.content, this.prefix)
    const command = this.fetch(commandName);

    if (command == null) {
      message.reply("Unknown command.");
      return;
    }

    command.execute(message, parseArgs(message.content, this.prefix));
  }
}
