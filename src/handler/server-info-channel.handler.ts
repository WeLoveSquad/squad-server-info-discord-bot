import {
  Channel,
  Client,
  EmbedBuilder,
  Guild,
  GuildBasedChannel,
  Message,
  TextChannel,
} from "discord.js";
import { Discord, Once } from "discordx";
import { DateTime, Duration } from "luxon";
import { container } from "tsyringe";
import { ServerAddress } from "../model/server-address.model.js";
import { ServerInfo } from "../model/server-info.model.js";
import { Logger } from "../services/logger.service.js";
import { ServerQueryService } from "../services/server-query.service.js";
import { StorageService } from "../services/storage.service.js";

@Discord()
export class ServerInfoChannelHandler {
  private guild?: Guild;
  private serverInfoChannel?: TextChannel;
  private serverInfoMessage?: Message;
  private interval?: NodeJS.Timer;

  private serverQueryService: ServerQueryService;
  private storageService: StorageService;
  private logger: Logger;

  constructor() {
    this.serverQueryService = container.resolve(ServerQueryService);
    this.storageService = container.resolve(StorageService);
    this.logger = container.resolve(Logger);
  }

  @Once({ event: "ready" })
  async onceReady(_: unknown, client: Client): Promise<void> {
    await this.initServerInfoChannel(client);

    this.storageService.addListener(StorageService.CHANNEL_UPDATED_EVENT, async () => {
      clearInterval(this.interval);

      if (this.serverInfoMessage) {
        try {
          await this.serverInfoMessage.delete();
          this.serverInfoMessage = undefined;
          this.logger.info("Server info channel has been updated. Deleted old server info message");
        } catch (error: any) {
          this.logger.warn(
            "Server info channel has been updated. Could not delete old server info message"
          );
        }
      }

      await this.initServerInfoChannel(client);
      await this.startUpdateInterval();
    });

    this.storageService.addListener(StorageService.SERVERS_UPDATED_EVENT, async () => {
      this.logger.debug("Servers have been updated. Will restart the update interval");
      await this.startUpdateInterval();
    });

    this.storageService.addListener(StorageService.TIME_ZONE_UPDATED_EVENT, async () => {
      this.logger.debug("Time zone has been updated. Will restart the update interval");
      await this.startUpdateInterval();
    });

    this.storageService.addListener(StorageService.INTERVAL_UPDATED_EVENT, async () => {
      this.logger.debug("Interval has been updated. Will restart the update interval");
      await this.startUpdateInterval();
    });

    await this.startUpdateInterval();
  }

  private async startUpdateInterval(): Promise<void> {
    clearInterval(this.interval);

    if (!this.guild || !this.serverInfoChannel) {
      this.logger.info(
        "Will not start the update interval because the server info channel has not been initialized yet"
      );
      return;
    }

    await this.syncServerInfos();
    this.interval = setInterval(async () => {
      await this.syncServerInfos();
    }, this.storageService.getUpdateIntervalSec() * 1000);
  }

  private async syncServerInfos(): Promise<void> {
    const servers = this.storageService.getServers();
    const embeds: EmbedBuilder[] = [];

    for (const [index, serverAddress] of servers.entries()) {
      this.logger.verbose("Syncing server infos for server: [%s]", serverAddress.toString());
      let embed;

      try {
        const serverInfo = await this.serverQueryService.getServerInfo(serverAddress);
        embed = this.buildServerInfoEmbed(serverInfo, index + 1);
      } catch (error: any) {
        this.logger.error(
          "Could not get server info for server: [%s]. Reason: [%s]",
          serverAddress.toString(),
          error
        );

        embed = this.buildServerInfoErrorEmbed(serverAddress, index + 1);
      }

      embeds.push(embed);
    }

    this.updateServerInfoMessage(embeds);
  }

  private async updateServerInfoMessage(embeds: EmbedBuilder[]): Promise<void> {
    if (embeds.length == 0) {
      if (this.serverInfoMessage) {
        try {
          await this.serverInfoMessage.delete();
        } catch (error: any) {
          this.logger.warn(
            "Could not delete server info message with id: [%s]. Error: [%s]",
            this.serverInfoMessage.id,
            error
          );
        }

        this.serverInfoMessage = undefined;
      }
      return;
    } else if (!this.serverInfoChannel) {
      this.logger.error(
        "Cannot update the server info message because serverInfoChannel is undefined"
      );
      return;
    }

    if (!this.serverInfoMessage) {
      this.serverInfoMessage = await this.serverInfoChannel.send({ embeds: embeds });
    } else {
      try {
        await this.serverInfoMessage.edit({ embeds: embeds });
      } catch (error: any) {
        this.logger.warn(
          "Could not edit server info message with id: [%s] and will send a new message. Error: [%s]",
          this.serverInfoMessage.id,
          error
        );

        this.serverInfoMessage = await this.serverInfoChannel.send({ embeds: embeds });
      }
    }
  }

  private async initServerInfoChannel(client: Client): Promise<void> {
    const guildId = this.storageService.getGuildId();
    const channelId = this.storageService.getChannelId();

    if (!guildId || !channelId) {
      this.logger.info(
        "Cannot init server info channel yet because the bot has not been initialized in a channel"
      );
      return;
    }

    this.guild = await this.getGuild(client, guildId);
    this.serverInfoChannel = await this.getServerInfoChannel(client, channelId);

    await this.serverInfoChannel.messages.fetch();
    const messages = [...this.serverInfoChannel.messages.cache];

    for (const [key, message] of messages) {
      if (!this.serverInfoMessage && message.author.id === client.user?.id) {
        this.serverInfoMessage = message;
      } else {
        try {
          await message.delete();
        } catch (error: any) {
          this.logger.warn(
            "Could not delete message: [%s] from server info channel during init. Error: [%s]",
            message.id,
            error
          );
        }
      }
    }
  }

  private async getGuild(client: Client, guildId: string): Promise<Guild> {
    try {
      return await client.guilds.fetch(guildId);
    } catch (error: any) {
      throw new Error(
        `Could not find guild with id: [${guildId}]. Reason: [${error?.rawError?.message}]`
      );
    }
  }

  private async getServerInfoChannel(client: Client, channelId: string): Promise<TextChannel> {
    const cachedServerInfoChannel: Channel | undefined = client.channels.cache.get(channelId);
    if (cachedServerInfoChannel) {
      return cachedServerInfoChannel as TextChannel;
    }

    if (!this.guild) {
      throw Error("Guild is undefined");
    }

    const channel: GuildBasedChannel | undefined = this.guild.channels.cache.get(channelId);
    if (!channel) {
      throw Error(`Could not find server info channel with id: [${channelId}]`);
    }

    if (channel.isTextBased()) {
      return channel as TextChannel;
    } else {
      throw Error("The server info channel is not a text channel");
    }
  }

  private buildServerInfoEmbed(serverInfo: ServerInfo, position: number): EmbedBuilder {
    const duration = Duration.fromObject({ seconds: serverInfo.playtimeSeconds });

    return new EmbedBuilder()
      .setTitle(serverInfo.serverName)
      .setThumbnail(`https://squadmaps.com/img/maps/full_size/${serverInfo.layer}.jpg`)
      .addFields(
        { name: "Layer", value: serverInfo.layer, inline: true },
        {
          name: "Teams",
          value: `${serverInfo.teamOne} - ${serverInfo.teamTwo}`,
          inline: true,
        },
        { name: "\u200B", value: "\u200B", inline: true },
        {
          name: "Players Online",
          value: `${serverInfo.playerCount.toString()}/${serverInfo.maxPlayerCount.toString()}`,
          inline: true,
        },
        { name: "Public Queue", value: serverInfo.publicQueue.toString(), inline: true },
        { name: "Whitelist Queue", value: serverInfo.whitelistQueue.toString(), inline: true },
        { name: "Round Time", value: duration.toFormat("hh:mm:ss") }
      )
      .setFooter({
        text: `#${position} | Last update: ${this.getTimestamp()}`,
      });
  }

  private buildServerInfoErrorEmbed(serverAddress: ServerAddress, position: number): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${serverAddress.ip}:${serverAddress.port}`)
      .setDescription("Server query endpoint is not responding")
      .setFooter({
        text: `#${position} | Last update: ${this.getTimestamp()}`,
      });
  }

  private getTimestamp(): string {
    return DateTime.now()
      .setZone(this.storageService.getTimeZone())
      .toFormat("dd.LL.yyyy HH:mm:ss");
  }
}
