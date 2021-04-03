import { Client, Message, MessageEmbed, User, Guild, GuildMember, Collection } from "discord.js";
import Rank, { IRank } from "@purrplingbot/models/rank";
import { CallbackError } from "mongoose";
import { error, debug, info } from "@purrplingbot/utils/logger";
import { autobind } from "core-decorators";
import PurrplingBot from "@purrplingbot/core/PurrplingBot";
import LevelCommand from "@purrplingbot/commands/Level";
import RankRole from "@purrplingbot/models/rankRole";
import { isWeekend, isEqual, startOfDay } from "date-fns";

export type RankConfig = {
  levelUpModifier?: number;
  levelUpOffset?: number;
  wordThres?: number;
  powerDiscriminator?: number;
}

export default class RankSystem {
  private _bot: PurrplingBot
  private _config: RankConfig

  constructor(bot: PurrplingBot, config: RankConfig) {
    this._bot = bot
    this._config = config ?? {};
  }

  public init() {
    this._bot.client.on("message", this.onMessage)
    this._bot.commander.addCommand(new LevelCommand(this, this._bot));
    info("Rank system initialized!");
  }

  public computeXpNeededToLevelUp(currentLevel: number): number {
    const levelupModifier = this._config.levelUpModifier ?? 250;
    const levelUpOffset = this._config.levelUpOffset ?? 0;

    return currentLevel > 0
      ? currentLevel * levelupModifier + levelUpOffset
      : levelupModifier / 2 + levelUpOffset
  }

  public async fetchEarnedRankRoles(member: GuildMember | undefined | null) {
    if (member == null) {
      return new Collection();
    }

    const guildRankRoles = await RankRole.findByGuild(member.guild);

    return member.roles.cache
      .filter(r => guildRankRoles.some(gr => gr.roleID === r.id))
  }

  public async fetchAvailableRolesForLevel(level: number, guild: Guild) {
    const guildRankRoles = (await RankRole.findByGuild(guild)).filter(gr => gr.level <= level);

    return (await guild.roles.fetch()).cache
      .filter(r => guildRankRoles.some(gr => gr.roleID === r.id));
  }

  public async fetchRoleRewardForLevel(level: number, guild: Guild) {
    const reward = await RankRole.findOneByGuildAndLevel(guild, level);

    if (!reward) {
      return null;
    }

    return guild.roles.fetch(reward.roleID);
  }

  public GetRankFor(user: User, guild: Guild): Promise<IRank | null> {
    return Rank.findOne({ userID: user.id, guildID: guild.id }).exec();
  }

  public async GetRankOrder(rank: IRank) : Promise<{ index: number, count: number }> {
    const sortedRanks = await Rank.find({ guildID: rank.guildID }).sort({ xp: "desc" }).exec();

    return {
      index: sortedRanks.findIndex((r: IRank) => r.userID === rank.userID),
      count: sortedRanks.length,
    }
  }

  public getExtraXp(message: Message) {
    let extraXp = 0;

    if (isWeekend(Date.now())) {
      extraXp += 4;
    }

    if (isEqual(new Date("1993-05-25"), startOfDay(new Date()))) {
      extraXp += 8;
    }

    if (message.embeds.length > 0) {
      extraXp += 2;
    }

    if (message.attachments.size > 0) {
      extraXp += 4;
    }

    console.log(extraXp);

    return extraXp;
  }

  public getPower(rank: IRank | null) {
    const powerDiscriminator = this._config.powerDiscriminator ?? 10000;

    if (rank == null) {
      return 1;
    }

    return 1 + (rank.messages / powerDiscriminator) + ((rank.words / 4) / powerDiscriminator);
  }

  @autobind
  onMessage(message: Message) {
    if (message.author.bot || this._bot.commander.isCommand(message) || message.guild == null) {
      // Don't count rank for: bots, direct messages and commands
      return;
    }

    const query = { userID: message.author.id, guildID: message.guild?.id };
    Rank.findOne(query, async (err: CallbackError, rank: IRank | null) => {
      if (err) {
        error(err.message);
        return;
      }

      const wordThres = this._config.wordThres ?? 6;
      const words = message.cleanContent.split(" ").length;
      const addedXp = Math.round(
        (message.cleanContent.length / 2 + words + this.getExtraXp(message)) * this.getPower(rank)
      );

      if (!rank) {
        const newRank = new Rank({
          userID: message.author.id,
          guildID: message.guild!.id,
          xp: addedXp,
          level: 0,
          messages: words > wordThres ? 1 : 0,
          words
        });

        newRank.save().catch((e: any) => error(e.message));
        return;
      }

      rank.xp += addedXp;
      rank.words += words;

      if (words > wordThres) {
        ++rank.messages;
      }

      const availableRoles = await this.fetchAvailableRolesForLevel(rank.level, message.guild!);
      for (const role of availableRoles) {
        message.member?.roles.add(role);
      }

      if (rank.xp >= this.computeXpNeededToLevelUp(rank.level)) {
        ++rank.level;
        const roleReward = await this.fetchRoleRewardForLevel(rank.level, message.guild!);

        if (roleReward) {
          message.channel.send(`Meow, ${message.author} just advanced to **level ${rank.level}** and earned **${roleReward.name}** role!`);
          debug(`User ${message.author.tag} earned role reward ${roleReward.name}`);
        } else {
          message.channel.send(`Meow, ${message.author} just advanced to **level ${rank.level}**!`);
        }
        debug(`User ${message.author.tag} leveled up to level ${rank.level}` 
        + ` in guild ${message.guild?.id} aka '${message.guild?.name}'`);
      }

      rank.save().catch((e: any) => error(e.message));
    });
  }
}