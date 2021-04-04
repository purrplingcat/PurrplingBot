import { Client, Message, MessageEmbed, User, Guild, GuildMember, Collection, Role } from "discord.js";
import Rank, { IRank } from "@purrplingbot/models/rank";
import { CallbackError } from "mongoose";
import { error, debug, info } from "@purrplingbot/utils/logger";
import { autobind } from "core-decorators";
import PurrplingBot from "@purrplingbot/core/PurrplingBot";
import LevelCommand from "@purrplingbot/commands/Level";
import RankRole from "@purrplingbot/models/rankRole";
import { isWeekend, isEqual, startOfDay, differenceInCalendarDays } from "date-fns";
import RewardsCommand from "@purrplingbot/commands/Rewards";

export type RankConfig = {
  levelUpModifier?: number;
  levelUpOffset?: number;
  wordThres?: number;
  powerDiscriminator?: number;
  minimumLevelXp?: number,
  reproductionNumber?: number;
  penaltyWordsPerMessageAvgThres?: number;
  announceLevelup?: boolean;
  announceReward?: boolean;
  announceFirstLevel?: boolean;
  extraPowerRoles?: { [role: string]: number };
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
    this._bot.commander.addCommand(new RewardsCommand());
    info("Rank system initialized!");
  }

  public computeXpNeededToLevelUp(currentLevel: number): number {
    const levelupModifier = this._config.levelUpModifier ?? 250;
    const levelUpOffset = this._config.levelUpOffset ?? 0;
    const minimumLevelXp = this._config.minimumLevelXp ?? 120;
    const R = this._config.reproductionNumber ?? 1.4;

    if (currentLevel <= 0) {
      return minimumLevelXp + levelUpOffset;
    }

    const neededXp = (2 * minimumLevelXp * currentLevel)
      + Math.pow(currentLevel, R) * levelupModifier
      + levelUpOffset;
    
    return Math.round(neededXp);
  }

  public async fetchEarnedRankRoles(member: GuildMember | undefined | null) {
    if (member == null) {
      return new Collection<string, Role>();
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

  public fetchRoleRewardForLevel(level: number, guild: Guild) {
    return RankRole.findOneByGuildAndLevel(guild, level);
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

    return extraXp;
  }

  public getPower(rank: IRank | null, member: GuildMember | null) {
    const powerDiscriminator = this._config.powerDiscriminator ?? 10000;
    const extraPower = this._config.extraPowerRoles ?? {};
    const penaltyAvgThres = this._config.penaltyWordsPerMessageAvgThres ?? 50;

    if (rank == null || member == null) {
      return 1;
    }

    const supressor = rank.messages / (rank.words || 1);
    const wordsPerMessageAvg = rank.words / (rank.messages || 1);
    let power = 1 + (wordsPerMessageAvg / powerDiscriminator) + (rank.messages / powerDiscriminator) - supressor;

    if (wordsPerMessageAvg >= penaltyAvgThres) {
      power -= (1 + wordsPerMessageAvg - penaltyAvgThres) / powerDiscriminator;
    }

    power += (differenceInCalendarDays(new Date(), member.joinedAt!) / 2) / powerDiscriminator;
    power += (rank.xp * wordsPerMessageAvg) / (rank.messages || 1) / powerDiscriminator - supressor / 2;

    for (const roleId of Object.keys(extraPower)) {
      const role = member.roles.cache.find(r => r.id == roleId);

      if (role) {
        power *= (extraPower[roleId] + 1);
        break;
      }
    }

    if (power < 0) {
      return 1;
    }

    return power;
  }

  @autobind
  onMessage(message: Message) {
    if (message.author.bot || this._bot.commander.isCommand(message) || message.guild == null) {
      // Don't count rank for: bots, direct messages and commands
      return;
    }

    const announceLevelUp = this._config.announceLevelup ?? false;
    const announceReward = this._config.announceReward ?? true;
    const announceFirstLevel = this._config.announceFirstLevel ?? true;
    const query = { userID: message.author.id, guildID: message.guild?.id };
    Rank.findOne(query, async (err: CallbackError, rank: IRank | null) => {
      if (err) {
        error(err.message);
        return;
      }

      const wordThres = this._config.wordThres ?? 6;
      const words = message.cleanContent.split(" ").length;
      const power = this.getPower(rank, message.member);
      const addedXp = Math.round(
        (message.cleanContent.length / 2 + words + this.getExtraXp(message)) * power
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

      if (words > wordThres) {
        rank.words += words;
        ++rank.messages;
      } else {
        const decrease = Math.round((addedXp * 0.1) + power) + (wordThres - words);
        rank.xp -= decrease < addedXp ? decrease : Math.max(0, addedXp - 1);
      }

      const xpNeeded = this.computeXpNeededToLevelUp(rank.level);
      if (rank.xp >= xpNeeded) {
        rank.xp = xpNeeded;
        rank.level++;

        const roleReward = await this.fetchRoleRewardForLevel(rank.level, message.guild!);
        const discordRole = message.guild?.roles.resolve(roleReward?.roleID || "")
        if (announceReward && roleReward && discordRole) {
          message.channel.send(
            `Meow, ${message.author} just advanced to **level ${rank.level}**`
            + ` and earned **${discordRole.name}** role! ${roleReward.description}`
          );
          debug(`User ${message.author.tag} earned role reward ${discordRole.name}`);
        } else if (announceFirstLevel && rank.level === 1) {
          message.channel.send(`Purrr purrrrr, ${message.author} begun their journey! They just advanced to **level ${rank.level}**!`);
        } else if (announceLevelUp) {
          message.channel.send(`Meow, ${message.author} just advanced to **level ${rank.level}**!`);
        }

        debug(`User ${message.author.tag} leveled up to level ${rank.level}` 
        + ` in guild ${message.guild?.id} aka '${message.guild?.name}'`);
      }

      if (message.member != null) {
        const availableRoles = await this.fetchAvailableRolesForLevel(rank.level, message.guild!);
        message.member.roles.add(availableRoles);
      }

      rank.save().catch((e: any) => error(e.message));
    });
  }
}