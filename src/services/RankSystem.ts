import { Message, User, Guild, GuildMember, Collection, Role, MessageEmbed } from "discord.js";
import Rank, { IRank } from "@purrplingbot/models/rank";
import { CallbackError } from "mongoose";
import { error, debug, info } from "@purrplingbot/utils/logger";
import { autobind } from "core-decorators";
import PurrplingBot from "@purrplingbot/core/PurrplingBot";
import LevelCommand from "@purrplingbot/commands/Level";
import RankRole from "@purrplingbot/models/rankRole";
import { isWeekend, isEqual, startOfDay, differenceInCalendarDays } from "date-fns";
import RewardsCommand from "@purrplingbot/commands/Rewards";
import Auditor from "@purrplingbot/services/Auditor";

export type RankConfig = {
  levelUpModifier?: number;
  levelUpOffset?: number;
  wordThres?: number;
  powerDiscriminator?: number;
  minimumLevelXp?: number,
  reproductionNumber?: number;
  penaltyWordsPerMessageAvgThres?: number;
  powerSupressorEnabled?: boolean;
  powerBonusEnabled?: boolean;
  announceLevelup?: boolean;
  announceReward?: boolean;
  announceFirstLevel?: boolean;
  extraPowerRoles?: { [role: string]: number };
  cooldown?: number;
  minimalPowerPenaltyLevel?: number;
  minimalPowerBonusLevel?: number;
}

export default class RankSystem {
  private _bot: PurrplingBot
  private _config: RankConfig
  private _auditor?: Auditor;
  private _coldownHolds = new Set<string>();

  constructor(bot: PurrplingBot, config: RankConfig, auditor?: Auditor) {
    this._bot = bot
    this._config = config ?? {};
    this._auditor = auditor;
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
    const R = this._config.reproductionNumber ?? 1.2;

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
    const loPenaltyAvgThres = (penaltyAvgThres * 0.4);
    const minimalPowerPenaltyLevel = this._config.minimalPowerPenaltyLevel ?? 10;
    const minimalPowerBonusLevel = this._config.minimalPowerBonusLevel ?? 10;
    const supressorEnabled = this._config.powerSupressorEnabled ?? false;
    const bonusEnabled = this._config.powerBonusEnabled ?? false;

    if (rank == null || member == null || rank.level <= 0) {
      return 1;
    }

    const wordsPerMessageAvg = rank.words / (rank.messages || 1);
    const wordsRatio = 1 / wordsPerMessageAvg;
    const lvlMsgRatio = rank.level / Math.max(1, rank.messages);
    const supressor = (supressorEnabled && lvlMsgRatio < 0.01 ? (rank.messages / (rank.words || 1)) : 0)
      / (rank.level >= minimalPowerPenaltyLevel ? 1 : 4);
    let power = 1 + (wordsPerMessageAvg / powerDiscriminator) + (rank.messages / powerDiscriminator) - supressor;

    if (supressorEnabled && rank.level >= minimalPowerPenaltyLevel) {
      // Penalize too high words/msg average
      if (wordsPerMessageAvg >= penaltyAvgThres) {
        power -= ((1 + wordsPerMessageAvg - penaltyAvgThres) / powerDiscriminator) * (bonusEnabled ? 2 : 1);
      }

      // Penalize too low words/msg average
      if (wordsPerMessageAvg < loPenaltyAvgThres) {
        power -= (supressor + (1 / Math.max(1, wordsPerMessageAvg))) * (bonusEnabled ? 2 : 1);
      }

      // Penalize too high messageword ratio
      if (wordsRatio > 0.5) {
        power -= Math.min(0.5, lvlMsgRatio / 2)
      }
    }

    if (bonusEnabled && rank.level >= minimalPowerBonusLevel) {
      const daysSinceJoin = differenceInCalendarDays(new Date(), member.joinedAt!);
      power += (daysSinceJoin / 10) / powerDiscriminator;
      power += (rank.xp * (wordsPerMessageAvg * 2)) / (rank.messages || 1) / powerDiscriminator - supressor / 2;
      power += wordsPerMessageAvg > loPenaltyAvgThres && wordsPerMessageAvg < penaltyAvgThres
        ? (wordsPerMessageAvg * 4) / powerDiscriminator - supressor / 2 : 0;
      power += Math.max((1 / Math.max(1, rank.level)) - (rank.level / powerDiscriminator)
        - (daysSinceJoin * 0.25 / powerDiscriminator), 0);
    }

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

    const cid = `${message.guild.id}/${message.author.id}`;
    const cooldown = this._config.cooldown ?? 800;

    // cooldown spam limiter
    if (this._coldownHolds.has(cid)) {
      info(`${message.author.tag}'s rank computing was limited by cooldown lock in guild ${message.guild}`);
      return;
    }
    
    // Set cooldown limiter with release timeout
    if (cooldown > 0) {
      this._coldownHolds.add(cid);
      setTimeout(() => {
        this._coldownHolds.delete(cid)
        debug(`Cooldown lock '${cid}' was released.`);
      }, cooldown);
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

      const wordThres = this._config.wordThres ?? 4;
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
        // Penalize too low words per message
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
        this.auditLevelUp(message.author, rank, discordRole);
      }

      if (message.member != null) {
        const availableRoles = await this.fetchAvailableRolesForLevel(rank.level, message.guild!);
        message.member.roles.add(availableRoles);
      }

      rank.save().catch((e: any) => error(e.message));
    });
  }

  private auditLevelUp(user: User, rank: IRank, rewardRole: Role | null | undefined) {
    if (this._auditor == null) {
      return;
    }

    const auditLevelUpMsg = new MessageEmbed({
      title: "Level up!",
      color: "AQUA",
      description: `${user} leveled up to **level ${rank.level}**!`,
      author: {
        name: user.tag,
        iconURL: user.avatarURL() || ""
      },
      fields: [
        { name: "New level", value: rank.level, inline: true },
        { name: "Reward", value: rewardRole || "*no reward*", inline: true },
      ],
    });

    this._auditor.logAudit(auditLevelUpMsg);
  }
}