import { Client, Message, TextChannel, User } from "discord.js";
import { Commander } from "@purrplingbot/core/Commander";
import { Gauge } from "prom-client";
import { autobind } from "core-decorators";
import { presenceStatusToNumber } from "@purrplingbot/core/utils";
import * as logger from '@purrplingbot/utils/logger';

type Metrics = {
  status: Gauge<never>;
  presence: Gauge<never>;
  readyAt: Gauge<never>;
  errors: Gauge<"type" | "level">;
  ping: Gauge<never>;
  guildMembers: Gauge<"guildName" | "guildId" | "status">;
  messageCount: Gauge<"channelId" | "channelName" | "guildName" | "guildId">;
};

export default class PurrplingBot {
  readonly client: Client;
  readonly commander: Commander;
  private readonly token: string;
  metrics: Metrics;

  constructor(client: Client, commander: Commander, token: string) {
    this.client = client;
    this.token = token;
    this.commander = commander;

    this.client.setInterval(this.watch, 5000);
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("message", this.onMessage.bind(this));
    this.client.on("error", this.onError);
    this.client.on("warn", this.onWarning);

    this.metrics = this.createMetrics();
  }

  private createMetrics(): Metrics {
    return {
      status: new Gauge({
        name: "purrplingbot_discord_client_status",
        help: "Discord websocket status (docs: https://discord.js.org/#/docs/main/stable/typedef/Status)",
      }),
      presence: new Gauge({
        name: "purrplingbot_discord_client_presence",
        help: "Discord client presence (0 - Online, 1 - idle, 2 - dnd, 3 - offline, -1 - unknown)",
      }),
      readyAt: new Gauge({
        name: "purrplingbot_discord_client_readyAt",
        help: "Sucessfully connected on discord at (timestamp)",
      }),
      errors: new Gauge({
        name: "purrplingbot_discord_client_errors",
        help: "Error state counter",
        labelNames: ["type", "level"],
      }),
      ping: new Gauge({
        name: "purrplingbot_discord_client_ping",
        help: "Discord server latency ms (ping)",
      }),
      guildMembers: new Gauge({
        name: "purrplingbot_discord_client_guildMembers",
        help: "Guild members statistics",
        labelNames: ["guildName", "guildId", "status"],
      }),
      messageCount: new Gauge({
        name: "purrplingbot_discord_client_messageCount",
        help: "Guild members statistics",
        labelNames: ["channelId", "channelName", "guildId", "guildName"],
      })
    }
  }

  @autobind
  watch(): void {
    this.metrics.status.set(this.client.ws.status);
    this.metrics.presence.set( presenceStatusToNumber(this.client.user?.presence.status || "offline"));
    this.metrics.ping.set(this.client.ws.ping);

    for (const guild of this.client.guilds.cache.array()) {
      const labels = { guildId: guild.id, guildName: guild.name };

      this.metrics.guildMembers.set(labels, guild.memberCount);
      this.metrics.guildMembers.set({ status: "online", ...labels }, guild.members.cache.filter(m => m.presence.status != "offline").size);
    }
  }

  private onReady(): void {
    logger.ready(`Logged in as ${this.client.user?.tag}`);
    this.metrics.readyAt.set(this.client.readyTimestamp ?? 0);
    this.client.user?.setActivity({name: "Meow"});
  }

  private onMessage(message: Message): void {
    this.updateMessageCount(message);

    if (message.author.bot || message.author === this.client.user) {
      return; // ignore own or bot messages
    }

    if (this.commander.isCommand(message)) {
      this.commander.process(message);
    }    
  }

  private updateMessageCount(message: Message): void {
    const guildLabels = { guildId: message.guild?.id, guildName: message.guild?.name }
    
    this.metrics.messageCount.inc(guildLabels);
    this.metrics.messageCount.inc({ channelId: message.channel.id, channelName: (message.channel as TextChannel).name, ...guildLabels });
  }

  @autobind
  private onError(error: Error): void {
    logger.error(error as unknown as string);

    this.metrics.errors.inc({ level: "error" });
    this.metrics.errors.inc({ type: error.name, level: "error" });
  }

  @autobind
  onWarning(): void {
    this.metrics.errors.inc({level: "warning"})
  }

  public run(): void {
    this.client
      .login(this.token)
      .catch(this.onError);
  }

  public getUserFromMention(mention: string) : User | null {  
    if (mention != null && mention.startsWith('<@') && mention.endsWith('>')) {
      mention = mention.slice(2, -1);
  
      if (mention.startsWith('!')) {
        mention = mention.slice(1);
      }
  
      return this.client.users.cache.get(mention) || null;
    }

    return null;
  }
}
