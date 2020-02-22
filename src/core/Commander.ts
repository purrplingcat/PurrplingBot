import { Message } from "discord.js";
import { extractCommandName } from "./utils";

export interface ICommand {
  name: string;
  description?: string;
  aliases?: string[];
  usage?: string;
  subcommands?: ICommand[];
  execute(message: Message, args?: string[]): void;
}

export class Commander {
  private readonly registry: ICommand[] = [];
  public readonly prefix: string = "!";

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix;
    }
  }

  getCommands(): ICommand[] {
    return Array.from(this.registry);
  }

  fetch(message: Message): ICommand | null {
    const commandName = extractCommandName(message.content, this.prefix);

    return this.registry.find(
      (command) => command.name === commandName || command.aliases?.includes(commandName)
    ) || null;
  }

  register(command: ICommand): void {
    this.registry.push(command);
  }
}
