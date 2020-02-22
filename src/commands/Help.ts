import { Command, Commander } from "@purrplingbot/core/Commander";
import { Message, MessageEmbed } from "discord.js";

export default class HelpCommand implements Command {
  name = "help";  
  description = "Need a help?";
  aliases?: string[] | undefined;
  usage?: string | undefined;
  subcommands?: Command[] | undefined;
  private readonly commander: Commander;

  constructor(commander: Commander) {
    this.commander = commander;
  }

  execute(message: Message, args: string[] = []): void {
    if (args.length > 0) {
      this.printCommandInfo(args[0], message);
      return;
    }

    const embed = new MessageEmbed({title: "Need a help?"});
    const commands = this.commander.getCommands();

    embed.setDescription(`
    You can do \`${this.commander.prefix}<command>\` to run a command, or \`${this.commander.prefix}help <command>\` for information about a specific command.\n
    **List of commands**\n
    ${commands.map(cmd => `\`${cmd.name}\``).sort().join(", ")}
    `);

    embed.setFooter(`${commands.length} commands • PurrplingBot __BOT_VERSION__ '__BOT_CODENAME__'`);

    message.channel.send(embed);
  }

  printCommandInfo(whichCommand: string, message: Message): void {
    const command = this.commander.getCommands().find(cmd => cmd.name === whichCommand || cmd.aliases?.includes(whichCommand));

    if (command == null) {
      message.reply(`\`${whichCommand}\` is not a known valid command!`);
      return;
    }

    const embed = new MessageEmbed({title: command.name});

    embed.setDescription(`
    ${command.description || ""}\n
    :information_source: Usage: \`${command.usage || "-"}\`
    :label: Aliases: ${command.aliases ? command.aliases.map(a => `\`${a}\``).join(", ") : "none"}
    `);
    embed.setFooter(`PurrplingBot __BOT_VERSION__ '__BOT_CODENAME__'`);

    message.channel.send(embed);
  }
}
