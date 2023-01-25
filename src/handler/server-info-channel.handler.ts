import {
  APIEmbedField,
  Channel,
  Client,
  EmbedBuilder,
  Guild,
  GuildBasedChannel,
  Message,
  RestOrArray,
  TextChannel,
} from "discord.js";
import { Discord, Once } from "discordx";
import { DateTime, Duration } from "luxon";
import { container } from "tsyringe";
import { Player } from "../model/player.model.js";
import { ServerInfo } from "../model/server-info.model.js";
import { SquadServer } from "../model/squad-server.model.js";
import { Squad } from "../model/squad.model.js";
import { Teams } from "../model/teams.model.js";
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
    const playerEmbeds: EmbedBuilder[] = [];

    for (const [index, server] of servers.entries()) {
      this.logger.verbose("Syncing server infos for server: [%s]", server.toString());
      let infoEmbed;

      const nextLayer = server.getNextLayer();

      let serverInfo;
      try {
        serverInfo = await this.serverQueryService.getServerInfo(server);
        infoEmbed = this.buildServerInfoEmbed(serverInfo, index + 1, nextLayer);
      } catch (error: any) {
        this.logger.error(
          "Could not get server info for server: [%s]. Reason: [%s]",
          server.toString(),
          error
        );

        infoEmbed = this.buildServerInfoErrorEmbed(server, index + 1);
      }

      embeds.push(infoEmbed);

      const teams = server.getTeams();
      if (server.showPlayers && serverInfo && teams) {
        playerEmbeds.push(this.buildPlayerEmbed(serverInfo, teams, index + 1));
      }
    }

    this.updateServerInfoMessage(embeds, playerEmbeds);
  }

  private async updateServerInfoMessage(
    infoEmbeds: EmbedBuilder[],
    playerEmbeds: EmbedBuilder[]
  ): Promise<void> {
    if (infoEmbeds.length == 0) {
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

    const embeds = [...infoEmbeds, ...playerEmbeds];

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

    for (const [_, message] of messages) {
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

  private buildServerInfoEmbed(
    serverInfo: ServerInfo,
    position: number,
    nextLayer: string | undefined
  ): EmbedBuilder {
    const duration = Duration.fromObject({ seconds: serverInfo.playtimeSeconds });

    const embed = new EmbedBuilder()
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
        { name: "Round Time", value: duration.toFormat("hh:mm:ss"), inline: true }
      )
      .setFooter({
        text: `#${position} | Last update: ${this.getTimestamp()}`,
      });

    if (nextLayer) {
      embed.addFields(
        { name: "Next Layer", value: nextLayer, inline: true },
        { name: "\u200B", value: "\u200B", inline: true }
      );
    }

    return embed;
  }

  private buildPlayerEmbed(serverInfo: ServerInfo, teams: Teams, position: number): EmbedBuilder {
    const embed = new EmbedBuilder().setTitle(`${serverInfo.serverName} - Players`);

    const teamOneEmbedFields = this.buildSquadsEmbedFields(teams.teamOneSquads);
    const teamOneUnassignedFields = this.buildUnassignedEmbedField(teams.teamOneUnassigned);
    const teamTwoEmbedFields = this.buildSquadsEmbedFields(teams.teamTwoSquads);
    const teamTwoUnassignedFields = this.buildUnassignedEmbedField(teams.teamTwoUnassigned);

    embed.addFields({
      name: `Team 1 - ${serverInfo.teamOne}`,
      value: `${teams.teamOnePlayerCount} Players`,
    });

    embed.addFields(...teamOneEmbedFields);
    if (teamOneUnassignedFields) {
      embed.addFields(...teamOneUnassignedFields);
    }

    embed.addFields({
      name: `Team 2 - ${serverInfo.teamTwo}`,
      value: `${teams.teamTwoPlayerCount} Players`,
    });

    embed.addFields(...teamTwoEmbedFields);
    if (teamTwoUnassignedFields) {
      embed.addFields(...teamTwoUnassignedFields);
    }

    embed.setFooter({
      text: `#${position} | Last update: ${this.getTimestamp()}`,
    });

    return embed;
  }

  private buildSquadsEmbedFields(squads: Map<number, Squad>): RestOrArray<APIEmbedField> {
    const fields: APIEmbedField[] = [];

    for (const [id, squad] of squads.entries()) {
      let squadMembers = "";
      for (const player of squad.players) {
        squadMembers += `> ${player.name}\n`;
      }

      const lock = squad.locked ? ":lock:" : ":unlock:";

      fields.push({
        name: `${id} | ${squad.name} (${squad.size}) ${lock}`,
        value: squadMembers,
        inline: true,
      });
    }

    if (fields.length % 3 == 2) {
      fields.push({ name: "\u200B", value: "\u200B", inline: true });
    } else if (fields.length % 3 == 1) {
      fields[fields.length - 1].inline = false;
    }

    return fields;
  }

  private buildUnassignedEmbedField(
    unassignedPlayers: Player[]
  ): RestOrArray<APIEmbedField> | undefined {
    if (unassignedPlayers.length == 0) {
      return undefined;
    }

    const unassignedFields = [
      {
        name: `Unassigned`,
        value: "",
        inline: true,
      },
      {
        name: `\u200B`,
        value: "",
        inline: true,
      },
      {
        name: `\u200B`,
        value: "",
        inline: true,
      },
    ];

    for (const [index, player] of unassignedPlayers.entries()) {
      unassignedFields[index % 3].value += `> ${player.name}\n`;
    }

    return unassignedFields.filter((field) => field.value !== "");
  }

  private buildServerInfoErrorEmbed(squadServer: SquadServer, position: number): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${squadServer.ip}:${squadServer.queryPort}`)
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
