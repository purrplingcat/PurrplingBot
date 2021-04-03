import { Command } from "@purrplingbot/core/Commander";
import { Message, MessageEmbed, Guild, User, TextChannel } from "discord.js";
import RankRole from "@purrplingbot/models/rankRole";

export default class RewardsCommand implements Command {
  name = "rewards";  
  visible = true;
  description = "Which rewards you can earn by your activity?";
  aliases = ["reward", "earnings", "ranks"];

  constructor() {
  }

  async execute(message: Message, args?: string[]): Promise<void> {
    if (message.guild == null) {
      message.reply("This command is not available for direct messages");
      return;
    }

    message.channel.startTyping();
    const rewardRankRoles = await RankRole.findByGuild(message.guild, true);
    const rewardsMessage = new MessageEmbed({
      color: "BLURPLE",
      title: `${message.guild}'s role rewards`,
      description: `There are total **${rewardRankRoles.length} role rewards**. Can you earn them all?`,
    });

    for (const rankRole of rewardRankRoles) {
      const role = message.guild.roles.resolve(rankRole.roleID);

      if (role) {
        rewardsMessage.addField(`Level ${rankRole.level}`, `${role} - ${rankRole.description}`);
      }
    }

    message.channel.stopTyping();
    message.channel.send(rewardsMessage);
  }
}
