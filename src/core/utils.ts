export function extractCommandName(commandLine: string, prefix = "!"): string {
  if (commandLine.startsWith(prefix)) {
    commandLine = commandLine.substring(prefix.length);
  }

  return commandLine.split(" ")[0];
}

export function parseArgs(commandLine: string, prefix = "!") {
  if (commandLine.startsWith(prefix)) {
    commandLine = commandLine.substring(prefix.length);
  }

  return commandLine.split(" ").slice(1);
}
