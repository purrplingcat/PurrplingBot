import CommandProvider from "@purrplingbot/core/CommandProvider";
import { Command } from "@purrplingbot/core/Commander";
import { injectable, multiInject } from "inversify";
import { COMMAND_TAG } from "@purrplingbot/commands";

@injectable()
export default class CoreCommandProvider implements CommandProvider {
  name = "CoreCommandProvider";

  constructor(
    @multiInject(COMMAND_TAG) private readonly commands: Command[],
  ) {}

  static TYPE = Symbol.for("CoreCommandProvider");

  getCommands(): Command[] {
    return this.commands;
  }

  async provide(commandName: string): Promise<Command | null> {
    return this.commands.find(c => c.name === commandName || c.aliases?.includes(commandName)) || null;
  }
}
