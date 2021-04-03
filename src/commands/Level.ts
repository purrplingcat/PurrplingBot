import { Command } from "@purrplingbot/core/Commander";
import { Message, MessageEmbed, Guild, User, TextChannel } from "discord.js";
import { debug } from "@purrplingbot/utils/logger";
import RankSystem from "@purrplingbot/services/RankSystem";
import PurrplingBot from "@purrplingbot/core/PurrplingBot";

export default class LevelCommand implements Command {
  name = "level";  
  visible = true;
  description = "How long is PurrplingBot alive?";
  private readonly _ranks: RankSystem;
  private readonly _bot: PurrplingBot;

  constructor(ranks: RankSystem, bot: PurrplingBot) {
    this._ranks = ranks;
    this._bot = bot;
  }

  private async fetchUser(userQuery: string, guild: Guild): Promise<User> {
    const mentioned = this._bot.getUserFromMention(userQuery);

    if (mentioned) {
      // User was found by mention, fetching user finished
      return mentioned;
    }

    // Try find user by query
    let guildMembers = (await guild.members.fetch({ query: userQuery, limit: 10 }));
    if (guildMembers.size <= 0) {
      // Try find user by tag
      guildMembers = (await guild.members.fetch()).filter(m => m.user.tag === userQuery );

      if (guildMembers.size <= 0) {
        throw new Error(`No user found: ${userQuery}`);
      }
    }

    if (guildMembers.size > 1) {
      // Multiple results are not allowed
      throw new Error(`Multiple users matched: ${guildMembers.array().map(m => m.user.tag).join(", ")}`
        + ` - Please specify more concrete query.`);
    }

    return guildMembers.first()!.user;
  }

  async execute(message: Message, args?: string[]): Promise<void> {
    if (message.guild == null) {
      message.reply("This command is not available for direct messages");
      return;
    }

    message.channel.startTyping();
    let user = message.author;

    if (args != null && args.length > 1) {
      try {
        user = await this.fetchUser(args[1], message.guild);
      }
      catch (err) {
        message.channel.stopTyping();
        message.reply(err.message);
        debug(`${err.message} for query '${args[1]}'`
        + ` in channel #${(message.channel as TextChannel).name} in guild ${message.guild}`);
        return;
      }
    }

    const rank = await this._ranks.GetRankFor(user, message.guild)

    if (rank == null) {
      message.channel.stopTyping();
      message.reply(`No rank stats for ${user.tag}.`);
      return;
    }

    const rankOrder = await this._ranks.GetRankOrder(rank);
    const rankEarnings = (await this._ranks.fetchEarnedRankRoles(message.guild.member(user))).array();
    const remainingXpToLevelUp = this._ranks.computeXpNeededToLevelUp(rank.level) - rank.xp;
    const rankMessage = new MessageEmbed({
      color: "PURPLE",
      author: {
        name: user.tag,
        iconURL: user.avatarURL() || ""
      },
      fields: [
        { name: "Rank", value: `${rankOrder.index + 1}/${rankOrder.count}`, inline: true },
        { name: "Level", value: rank.level, inline: true },
        { name: "Experience", value: `${rank.xp} (\`${remainingXpToLevelUp}\` remains to level up)`, inline: true },
        { name: "Power", value: this._ranks.getPower(rank).toFixed(2) },
        { name: "Rank earnings", value: rankEarnings.length > 0 ? rankEarnings : "*No earnings yet*" }
      ],
    });

    message.channel.stopTyping();
    message.channel.send(rankMessage);
  }
}
