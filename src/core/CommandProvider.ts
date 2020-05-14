import { Command } from "@purrplingbot/core/Commander";

export default interface CommandProvider {
  name: string;
  getCommands(): Command[] | Promise<Command[]>;
  provide(commandName: string): Command | Promise<Command | null> | null;
}
