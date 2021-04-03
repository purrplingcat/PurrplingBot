import mongoose from "mongoose"
import { Guild } from "discord.js";

export interface IRankRole extends mongoose.Document {
  roleID: string;
  guildID: string;
  level: number;
}

export interface IRankRoleModel extends mongoose.Model<IRankRole> {
  findByGuild(guild: Guild): Promise<IRankRole[]>;
  findOneByGuildAndLevel(guild: Guild, level: number): Promise<IRankRole>;
}

const rankRoleSchema = new mongoose.Schema<IRankRole, IRankRoleModel>({
  roleID: { type: String, required: true },
  guildID: { type: String, required: true },
  level: { type: Number, required: true },
});

rankRoleSchema.statics.findByGuild = function (guild: Guild) { 
  return this.find({ guildID: guild.id }).exec();
}
rankRoleSchema.statics.findOneByGuildAndLevel = function (guild: Guild, level: number) {
  return this.findOne({ guildID: guild.id, level }).exec();
}

export default mongoose.model<IRankRole, IRankRoleModel>("RankRole", rankRoleSchema);
