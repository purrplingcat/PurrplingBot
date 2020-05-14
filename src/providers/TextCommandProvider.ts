import CommandProvider from "@purrplingbot/core/CommandProvider";
import { Command } from "@purrplingbot/core/Commander";
import { injectable, inject } from "inversify";
import Database from "@purrplingbot/services/Database";
import TextCommand from "@purrplingbot/entities/TextCommand";
import { Repository, SelectQueryBuilder } from "typeorm";

@injectable()
export default class TextCommandProvider implements CommandProvider {
  name = "TextCommandProvider";
  commandSource: Repository<TextCommand>;
  
  constructor(database: Database) {
    this.commandSource = database.getRepositoryFor(TextCommand);
  }

  async getCommands(): Promise<Command[]> {
    const textCommands = await this.commandSource.find({ relations: ["aliases"] });
    
    return textCommands.map(this.createCommand);
  }

  createCommand(entity: TextCommand): Command {
    return {
      name: entity.name,
      direct: true,
      description: entity.description,
      aliases: entity.aliases?.map(a => a.name),
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      execute: (message) => { message.channel.send(entity.content) },
    };
  }

  async provide(commandName: string): Promise<Command | null> {
    const textCmd = await this.commandSource.createQueryBuilder("command")
      .leftJoinAndSelect("command.aliases", "alias")
      .where("command.name = :commandName OR alias.name = :commandName", { commandName })
      .getOne();

    if (textCmd == null) {
      return null;
    }

    return this.createCommand(textCmd);
  }
}