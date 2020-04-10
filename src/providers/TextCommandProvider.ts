import CommandProvider from "@purrplingbot/core/CommandProvider";
import { Command } from "@purrplingbot/core/Commander";

export type TextCommand = {
  name: string;
  description?: string;
  aliases?: string[];
  content: string;
};

export default class TextCommandProvider implements CommandProvider {
  name = "TextCommandProvider";
  texts: TextCommand[];
  
  constructor(texts: TextCommand[]) {
    this.texts = texts;
  }

  getCommands(): Command[] {
    const commands: Command[] = [];

    for (const textCmd of this.texts) {
      const command = this.provide(textCmd.name);

      if (command != null) {
        commands.push(command);
      }
    }

    return commands;
  }

  provide(commandName: string): Command | null {
    const textCmd = this.texts.find(
      t => t.name === commandName || t.aliases?.includes(commandName)
    );

    if (textCmd == null) {
      return null;
    }
    
    return {
      name: textCmd.name,
      direct: true,
      description: textCmd.description,
      aliases: textCmd.aliases,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      execute: (message) => { message.channel.send(textCmd.content) },
    };
  }
}