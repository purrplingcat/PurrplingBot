import { Client, Message, MessageEmbed, MessageEmbedOptions, GuildMember, User } from "discord.js";
import { autobind } from 'core-decorators';
import { isValidTextChannel } from "@purrplingbot/utils/util";
import { format } from "date-fns";

export default class Auditor {
  constructor(
    private readonly client: Client,
    private readonly auditChannelId: string) { }

  init() {
    this.client.on("messageDelete", this.onDelete);
    this.client.on("messageUpdate", this.onEdit);
  }

  async logAudit(message: Message | MessageEmbed) {
    const auditChannel = await this.client.channels.fetch(this.auditChannelId);

    if (isValidTextChannel(auditChannel)) {
      await auditChannel.send(message)
    }
  }

  private async resolveWho(message: Message): Promise<User> {
    const entry = await message.guild?.fetchAuditLogs({ type: 'MESSAGE_DELETE' }).then(audit => audit.entries.first())

    if (entry == null) {
      return message.author;
    }

    const extra = entry.extra as any; // For message extra info doesn't exists any type

    if (
      extra != null && extra.channel.id === message.channel.id
      && (entry.target instanceof User && entry.target.id === message.author.id)
      && (entry.createdTimestamp > (Date.now() - 5000)
      && extra.count >= 1)
    ) {
      return entry.executor
    } else {
      return message.author
    }
  }

  @autobind
  private async onDelete(message: Message) {
    const who = await this.resolveWho(message);
    const logMessage: MessageEmbedOptions = {
      title: "Message deleted",
      color: 15158332,
      author: {
        name: `${who.username}#${who.discriminator}`,
        iconURL: who.avatarURL() || ""
      },
      fields: [
        { name: "Original message", value: message.cleanContent || "*No plaintext message*" },
        { name: "Message author", value: `${message.author.username}#${message.author.discriminator}`, inline: true },
        { name: "Count of embeds", value: String(message.embeds.length), inline: true },
        { name: "Deleted at", value: format(Date.now(), "d.M.yyyy h:m:s a (O)"), inline: true }
      ]
    }

    await this.logAudit(new MessageEmbed(logMessage));
  }

  @autobind
  private async onEdit(oldMessage: Message, newMessage: Message) {
    if (newMessage.author.id === this.client.user?.id) {
      return;
    }

    const logMessage: MessageEmbedOptions = {
      title: "Message edited",
      color: 15105570,
      author: {
        name: `${newMessage.author.username}#${newMessage.author.discriminator}`,
        iconURL: newMessage.author.avatarURL() || ""
      },
      fields: [
        { name: "Original message", value: oldMessage.cleanContent || "*No plaintext message*" },
        { name: "Changed message", value: newMessage.cleanContent || "*No plaintext message*" },
        { name: "Message author", value: `${oldMessage.author.username}#${oldMessage.author.discriminator}`, inline: true },
        { name: "Edited at", value: format(Date.now(), "d.M.yyyy h:m:s a (O)"), inline: true }
      ]
    }

    await this.logAudit(new MessageEmbed(logMessage));
  }
  
}
