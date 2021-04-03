import mongoose from "mongoose"

export interface IRank extends mongoose.Document {
  userID: string;
  guildID: string;
  xp: number;
  level: number;
  messages: number;
  words: number;
}

const levelSchema = new mongoose.Schema<IRank>({
  userID: String,
  guildID: String,
  xp: Number,
  level: Number,
  messages: { type: Number, default: 0 },
  words: { type: Number, default: 0 },
});

export default mongoose.model<IRank>("Rank", levelSchema);
