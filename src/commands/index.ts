import { interfaces, ContainerModule } from "inversify";
import FunfactCommand from "@purrplingbot/commands/Funfact";
import { Commander, Command } from "@purrplingbot/core/Commander";
import HelpCommand from "@purrplingbot/commands/Help";
import TimeCommand from "@purrplingbot/commands/Time";
import UptimeCommand from "@purrplingbot/commands/Uptime";

export const COMMAND_TAG = Symbol.for("Commander#command");

export function createCommandsContainer() {
  return new ContainerModule((bind) => {
    bind<FunfactCommand>(COMMAND_TAG).to(FunfactCommand).inSingletonScope();
    bind<HelpCommand>(COMMAND_TAG).to(HelpCommand).inSingletonScope();
    bind<TimeCommand>(COMMAND_TAG).to(TimeCommand);
    bind<UptimeCommand>(COMMAND_TAG).to(UptimeCommand);
  })
}
