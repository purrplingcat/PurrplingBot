import { PresenceStatus } from "discord.js";

export function extractCommandName(commandLine: string, prefix = "!"): string {
  if (commandLine.startsWith(prefix)) {
    commandLine = commandLine.substring(prefix.length);
  }

  return commandLine.split(" ")[0];
}

export function parseArgs(commandLine: string, prefix = "!"): string[] {
  if (commandLine.startsWith(prefix)) {
    commandLine = commandLine.substring(prefix.length);
  }

  return commandLine.split(" ");
}

export function presenceStatusToNumber(presence: PresenceStatus) {
  switch (presence) {
    case "online":
      return 0;
    case "idle":
      return 1;
    case "dnd":
      return 2;
    case "offline":
      return 3;
    default:
      return -1;
  }
}
