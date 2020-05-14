import { Client, Message, MessageEmbed, MessageEmbedOptions, User, PartialMessage } from "discord.js";
import { autobind } from 'core-decorators';
import { isValidTextChannel } from "@purrplingbot/utils/util";
import { format } from "date-fns";
import { injectable, inject } from "inversify";
import types from "@purrplingbot/types";

@injectable()
export default class Auditor {
  public static TYPE = Symbol.for("Auditor");

  constructor(
    @inject(types.DiscordClient) private readonly client: Client,
    @inject("cfg.auditor.channelId") private readonly auditChannelId: string) { }

  init(): void {
    this.client.on("messageDelete", this.onDelete);
    this.client.on("messageUpdate", this.onEdit);
  }

  async logAudit(message: Message | MessageEmbed): Promise<void> {
    const auditChannel = await this.client.channels.fetch(this.auditChannelId);

    if (isValidTextChannel(auditChannel)) {
      await auditChannel.send(message)
    }
  }

  private async resolveWho(message: Message | PartialMessage): Promise<User | null> {
    const entry = await message.guild?.fetchAuditLogs({ type: 'MESSAGE_DELETE' }).then(audit => audit.entries.first())

    if (entry == null) {
      return message.author;
    }

    const extra = entry.extra as any; // eslint-disable-line

    if (
      extra != null && extra.channel.id === message.channel.id
      && (entry.target instanceof User && entry.target.id === message.author?.id)
      && (entry.createdTimestamp > (Date.now() - 5000)
      && extra.count >= 1)
    ) {
      return entry.executor
    } else {
      return message.author
    }
  }

  @autobind
  private async onDelete(message: Message | PartialMessage): Promise<void> {
    const who = await this.resolveWho(message);
    const logMessage: MessageEmbedOptions = {
      title: "Message deleted",
      color: 15158332,
      author: {
        name: who ? `${who.username}#${who.discriminator}` : "unknown",
        iconURL: who?.avatarURL() || ""
      },
      fields: [
        {
          name: "Original message",
          value: message.cleanContent || "*No message content*"
        },
        {
          name: "Message author",
          value: message.author ? `${message.author.username}#${message.author.discriminator}` : "unknown",
          inline: true
        },
        {
          name: "Count of embeds",
          value: String(message.embeds?.length),
          inline: true
        },
        {
          name: "Deleted at",
          value: format(Date.now(), "d.M.yyyy h:m:s a (O)"),
          inline: true
        }
      ]
    }

    await this.logAudit(new MessageEmbed(logMessage));
  }

  @autobind
  private async onEdit(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
    if (newMessage.author?.id === this.client.user?.id) {
      return;
    }

    const logMessage: MessageEmbedOptions = {
      title: "Message edited",
      color: 15105570,
      author: {
        name: `${newMessage.author?.username}#${newMessage.author?.discriminator}`,
        iconURL: newMessage.author?.avatarURL() || ""
      },
      fields: [
        { name: "Original message", value: oldMessage.cleanContent || "*No plaintext message*" },
        { name: "Changed message", value: newMessage.cleanContent || "*No plaintext message*" },
        { name: "Message author", value: `${oldMessage.author?.username}#${oldMessage.author?.discriminator}`, inline: true },
        { name: "Edited at", value: format(Date.now(), "d.M.yyyy h:m:s a (O)"), inline: true }
      ]
    }

    await this.logAudit(new MessageEmbed(logMessage));
  }
  
}
