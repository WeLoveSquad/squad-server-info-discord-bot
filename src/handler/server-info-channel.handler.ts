import config from "config";
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

  private serverQueryService: ServerQueryService;
  private storageService: StorageService;
  private logger: Logger;

  constructor() {
    this.serverQueryService = container.resolve(ServerQueryService);
    this.storageService = container.resolve(StorageService);
    this.logger = container.resolve(Logger);
  }

  @Once({ event: "ready" })
  async onceReady(_: unknown, client: Client) {
    await this.initServerInfoChannel(client);

    this.storageService.addListener(StorageService.STORAGE_UPDATED_EVENT, async () => {
      await this.syncServerInfos();
    });

    await this.syncServerInfos();
    setInterval(async () => {
      await this.syncServerInfos();
    }, config.get<number>("discord.messageUpdateIntervalSec") * 1000);
  }

  private async syncServerInfos() {
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

  private async updateServerInfoMessage(embeds: EmbedBuilder[]) {
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

  private async initServerInfoChannel(client: Client) {
    this.guild = await this.getGuild(client);
    this.serverInfoChannel = await this.getServerInfoChannel(client);

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

  private async getGuild(client: Client): Promise<Guild> {
    try {
      return await client.guilds.fetch(config.get<string>("discord.guild"));
    } catch (error: any) {
      throw new Error(
        `Could not find guild with id: [${config.get<string>("discord.guild")}]. Reason: [${
          error?.rawError?.message
        }]`
      );
    }
  }

  private async getServerInfoChannel(client: Client): Promise<TextChannel> {
    const cachedServerInfoChannel: Channel | undefined = client.channels.cache.get(
      config.get<string>("discord.serverInfoChannel")
    );
    if (cachedServerInfoChannel) {
      return cachedServerInfoChannel as TextChannel;
    }

    if (!this.guild) {
      throw Error("Could not find guild from config");
    }

    const channel: GuildBasedChannel | undefined = this.guild.channels.cache.get(
      config.get<string>("discord.serverInfoChannel")
    );
    if (!channel) {
      throw Error("Could not find server info channel from config");
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
        text: `#${position} Last update: ${DateTime.now().toFormat("dd.LL.yyyy HH:mm:ss")}`,
      });
  }

  private buildServerInfoErrorEmbed(serverAddress: ServerAddress, position: number) {
    return new EmbedBuilder()
      .setTitle(`${serverAddress.ip}:${serverAddress.port}`)
      .setDescription("Server query endpoint is unreachable")
      .setFooter({
        text: `#${position} Last update: ${DateTime.now().toFormat("dd.LL.yyyy HH:mm:ss")}`,
      });
  }
}
