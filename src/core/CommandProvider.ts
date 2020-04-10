import { Command } from "@purrplingbot/core/Commander";

export default interface CommandProvider {
  name: string;
  getCommands(): Command[];
  provide(commandName: string): Command | null;
}
