import mongoose from "mongoose"
import { Guild } from "discord.js";

export interface IRankRole extends mongoose.Document {
  roleID: string;
  guildID: string;
  level: number;
  description: string;
}

export interface IRankRoleModel extends mongoose.Model<IRankRole> {
  findByGuild(guild: Guild, levelSorted?: boolean): Promise<IRankRole[]>;
  findOneByGuildAndLevel(guild: Guild, level: number): Promise<IRankRole | null>;
  findHighestRole(guild: Guild, level: number): Promise<IRankRole | null>;
}

const rankRoleSchema = new mongoose.Schema<IRankRole, IRankRoleModel>({
  roleID: { type: String, required: true },
  guildID: { type: String, required: true },
  level: { type: Number, required: true },
  description: { type: String, default: "" },
});

rankRoleSchema.statics.findByGuild = function (guild: Guild, levelSorted = false) { 
  const query = this.find({ guildID: guild.id });
  
  if (levelSorted) {
    return query.sort({ level: "desc" }).exec();
  }

  return query.exec();
}
rankRoleSchema.statics.findOneByGuildAndLevel = function (guild: Guild, level: number) {
  return this.findOne({ guildID: guild.id, level }).exec();
}
rankRoleSchema.statics.findHighestRole = function (guild: Guild, level: number) {
  return this.findOne({ guildID: guild.id, level: { $lte: level } }).sort({ level: "desc" }).exec();
}

export default mongoose.model<IRankRole, IRankRoleModel>("RankRole", rankRoleSchema);
