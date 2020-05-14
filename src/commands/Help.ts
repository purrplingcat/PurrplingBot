import { Command, Commander } from "@purrplingbot/core/Commander";
import { Message, MessageEmbed } from "discord.js";
import { injectable, inject } from "inversify";

@injectable()
export default class HelpCommand implements Command {
  name = "help";  
  direct = true;
  description = "Need a help?";
  aliases?: string[] | undefined;
  usage?: string | undefined;
  subcommands?: Command[] | undefined;
  private readonly commander: Commander;

  constructor(
    @inject(Commander.TYPE) commander: Commander
  ) {
    this.commander = commander;
  }

  async execute(message: Message, args: string[] = []): Promise<void> {
    if (args.length > 1) {
      this.printCommandInfo(args[1], message);
      return;
    }

    const embed = new MessageEmbed({title: "Need a help?"});
    const commands = (await this.commander
      .getCommands())
      .filter(command => command.direct)
      .reduce<string[]>((acc, curr) => acc.concat(curr.name, curr.aliases || []), [])
      .sort();


    embed.setDescription(`
    You can do \`${this.commander.prefix}<command>\` to run a command, or \`${this.commander.prefix}help <command>\` for information about a specific command.\n
    **List of commands**\n
    ${commands.map(cmdName => `\`${cmdName}\``).join(", ")}
    `);

    embed.setFooter(`${commands.length} commands • PurrplingBot __BOT_VERSION__ '__BOT_CODENAME__'`);

    message.channel.send(embed);
  }

  async printCommandInfo(whichCommand: string, message: Message): Promise<void> {
    const command = (await this.commander.getCommands()).find(cmd => cmd.name === whichCommand || cmd.aliases?.includes(whichCommand));

    if (command == null) {
      message.reply(`\`${whichCommand}\` is not a known valid command!`);
      return;
    }

    const embed = new MessageEmbed({title: command.name});

    embed.setDescription(`
    ${command.description || ""}\n
    :information_source: Usage: \`${command.usage || `${this.commander.prefix}${command.name}`}\`
    :label: Aliases: ${command.aliases ? command.aliases.map(a => `\`${a}\``).join(", ") : "none"}
    `);
    embed.setFooter(`PurrplingBot __BOT_VERSION__ '__BOT_CODENAME__'`);

    message.channel.send(embed);
  }
}
