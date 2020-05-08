import { Channel, TextChannel } from "discord.js";

export function isValidTextChannel(channel: Channel): channel is TextChannel {
  return channel != null && channel.type == "text";
}
