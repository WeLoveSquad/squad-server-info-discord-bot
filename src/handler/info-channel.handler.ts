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
import { container } from "tsyringe";
import { Team } from "../enums/team.enum.js";
import { ComponentService } from "../services/component.service.js";
import { Logger } from "../services/logger.service.js";
import { ServerQueryError, ServerService } from "../services/server.service.js";
import { SettingsService } from "../services/settings.service.js";

@Discord()
export class InfoChannelHandler {
  private guild?: Guild;
  private serverInfoChannel?: TextChannel;
  private serverInfoMessage?: Message;
  private interval?: NodeJS.Timer;

  private playerInfoChannel?: TextChannel;
  private playerInfoMessages: Message[] = [];

  private settingsService: SettingsService;
  private logger: Logger;
  private serverService: ServerService;
  private componentService: ComponentService;

  constructor() {
    this.serverService = container.resolve(ServerService);
    this.settingsService = container.resolve(SettingsService);
    this.componentService = container.resolve(ComponentService);
    this.logger = container.resolve(Logger);
  }

  @Once({ event: "ready" })
  async onceReady(_: unknown, client: Client): Promise<void> {
    await this.initServerInfoChannel(client);
    await this.initPlayerInfoChannel(client);

    this.settingsService.addListener(SettingsService.SERVER_CHANNEL_UPDATED_EVENT, async () => {
      await this.handleServerChannelUpdated(client);
    });

    this.settingsService.addListener(SettingsService.PLAYER_CHANNEL_UPDATED_EVENT, async () => {
      await this.handlePlayerChannelUpdated(client);
    });

    this.settingsService.addListener(SettingsService.SETTINGS_RESET_EVENT, async () => {
      await this.handleSettingsReset();
    });

    this.settingsService.addListener(SettingsService.SETTINGS_UPDATED_EVENT, async () => {
      this.logger.debug("Settings have been updated. Will restart the update interval");
      await this.startUpdateInterval();
    });

    await this.startUpdateInterval();
  }

  private async handleServerChannelUpdated(client: Client): Promise<void> {
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
    await this.initPlayerInfoChannel(client);
    await this.startUpdateInterval();
  }

  private async handlePlayerChannelUpdated(client: Client): Promise<void> {
    clearInterval(this.interval);

    this.playerInfoMessages = [];
    await this.clearPlayerInfoChannel();
    this.playerInfoChannel = undefined;

    await this.initPlayerInfoChannel(client);
    await this.startUpdateInterval();
  }

  private async handleSettingsReset(): Promise<void> {
    clearInterval(this.interval);

    this.playerInfoChannel = undefined;
    this.serverInfoChannel = undefined;

    if (this.serverInfoMessage) {
      await this.deleteMessage(this.serverInfoMessage);
    }
    this.serverInfoMessage = undefined;

    for (const message of this.playerInfoMessages) {
      await this.deleteMessage(message);
    }
    this.playerInfoMessages = [];

    this.logger.info(
      "Settings have been reset. Deleted all messages and stopped requesting server information"
    );
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
      await this.clearServerInfoChannel();
      await this.clearPlayerInfoChannel();
      await this.syncServerInfos();
    }, this.settingsService.getUpdateIntervalSec() * 1000);
  }

  private async syncServerInfos(): Promise<void> {
    const servers = this.serverService.getServers();
    const serverEmbeds: EmbedBuilder[] = [];
    const playerEmbeds: EmbedBuilder[] = [];

    for (const [index, server] of servers.entries()) {
      const position = index + 1;

      let serverInfo;
      try {
        serverInfo = await this.serverService.getServerInfo(server);
        serverEmbeds.push(this.componentService.buildServerInfoEmbed(serverInfo, position));
      } catch (error: any) {
        if (error instanceof ServerQueryError) {
          serverEmbeds.push(
            this.componentService.buildServerInfoErrorEmbed(server, position, error.message)
          );
        } else {
          serverEmbeds.push(this.componentService.buildServerInfoErrorEmbed(server, position));
        }
        continue;
      }

      if (server.rconEnabled && this.settingsService.isPlayerChannelInitialized()) {
        playerEmbeds.push(
          this.componentService.buildPlayerInfoEmbed(serverInfo, Team.ONE, position)
        );
        playerEmbeds.push(
          this.componentService.buildPlayerInfoEmbed(serverInfo, Team.TWO, position)
        );
      }
    }

    await this.updateInfoMessages(serverEmbeds, playerEmbeds);
  }

  private async updateInfoMessages(
    serverEmbeds: EmbedBuilder[],
    playerEmbeds: EmbedBuilder[]
  ): Promise<void> {
    await this.updateServerInfoMessage(serverEmbeds);

    if (this.settingsService.isPlayerChannelInitialized()) {
      try {
        await this.updatePlayerInfoMessages(playerEmbeds);
      } catch (error: any) {
        this.logger.warn(
          "An error occured while updating the player info messages. Will resend all messages"
        );

        await this.updatePlayerInfoMessages(playerEmbeds, true);
        await this.clearPlayerInfoChannel();
      }
    }
  }

  private async updateServerInfoMessage(infoEmbeds: EmbedBuilder[]): Promise<void> {
    if (!this.serverInfoChannel) {
      this.logger.error(
        "Cannot update the server info message because serverInfoChannel is undefined"
      );
      return;
    }

    const components = [];

    if (
      this.settingsService.isPlayerChannelInitialized() &&
      this.playerInfoMessages.length >= 1 &&
      this.serverInfoChannel.id !== this.playerInfoChannel?.id
    ) {
      const buttonRow = this.componentService.buildPlayerInfoLinkButton(
        this.playerInfoMessages[0].id
      );
      components.push(buttonRow);
    }

    if (!this.serverInfoMessage) {
      this.serverInfoMessage = await this.serverInfoChannel.send({
        embeds: infoEmbeds,
        components: components,
      });
    } else {
      try {
        await this.serverInfoMessage.edit({ embeds: infoEmbeds, components: components });
      } catch (error: any) {
        this.logger.warn(
          "Could not edit server info message with id: [%s] and will send a new message. Error: [%s]",
          this.serverInfoMessage.id,
          error
        );

        this.serverInfoMessage = await this.serverInfoChannel.send({
          embeds: infoEmbeds,
          components: components,
        });
      }
    }
  }

  private async updatePlayerInfoMessages(playerEmbeds: EmbedBuilder[], resendAll: boolean = false) {
    if (!this.playerInfoChannel) {
      this.logger.error(
        "Cannot update the player info messages because playerInfoChannel is undefined"
      );
      return;
    }

    if (resendAll) {
      this.playerInfoMessages = [];
    }

    for (const [index, embed] of playerEmbeds.entries()) {
      const components = [];

      if (index % 2 == 1 && this.serverInfoMessage) {
        components.push(this.componentService.buildServerInfoLinkButton(this.serverInfoMessage.id));
      }

      if (index < this.playerInfoMessages.length) {
        await this.playerInfoMessages[index].edit({ embeds: [embed], components: components });
      } else {
        const message = await this.playerInfoChannel.send({
          embeds: [embed],
          components: components,
        });
        this.playerInfoMessages.push(message);
      }
    }
  }

  private async initServerInfoChannel(client: Client): Promise<void> {
    const guildId = this.settingsService.getGuildId();
    const channelId = this.settingsService.getServerChannelId();

    if (!guildId || !channelId) {
      this.logger.info(
        "Cannot init server info channel yet because the bot has not been initialized in a channel"
      );
      return;
    }

    this.guild = await this.getGuild(client, guildId);
    this.serverInfoChannel = await this.getDiscordChannel(client, channelId);

    const messages = await this.serverInfoChannel.messages.fetch();

    for (const [_, message] of messages) {
      if (!this.serverInfoMessage && message.author.id === client.user?.id) {
        this.serverInfoMessage = message;
      } else {
        await this.deleteMessage(message);
      }
    }
  }

  private async initPlayerInfoChannel(client: Client): Promise<void> {
    if (!this.guild) {
      this.logger.info(
        "Cannot init player info channel before server info channel has been initialized"
      );
      return;
    }

    const playerChannelId = this.settingsService.getPlayerChannelId();
    if (!playerChannelId) {
      this.logger.info(
        "Cannot init player info channel because player info channel has not been initialized"
      );
      return;
    }

    this.playerInfoChannel = await this.getDiscordChannel(client, playerChannelId);

    const messages = await this.playerInfoChannel.messages.fetch();
    for (const [_, message] of messages) {
      if (message.author.id !== client.user?.id) {
        await this.deleteMessage(message);
      } else if (message.id !== this.serverInfoMessage?.id) {
        this.playerInfoMessages.splice(0, 0, message);
      }
    }
  }

  private async deleteMessage(message: Message): Promise<void> {
    try {
      await message.delete();
    } catch (error: any) {
      this.logger.warn("Could not delete message: [%s]. Error: [%s]", message.id, error);
    }
  }

  private async getGuild(client: Client, guildId: string): Promise<Guild> {
    try {
      return await client.guilds.fetch(guildId);
    } catch (error: any) {
      throw new Error(`Could not find guild with id: '${guildId}'. Reason: '${error}'`);
    }
  }

  private async getDiscordChannel(client: Client, channelId: string): Promise<TextChannel> {
    const cachedChannel: Channel | undefined = client.channels.cache.get(channelId);
    if (cachedChannel) {
      return cachedChannel as TextChannel;
    }

    if (!this.guild) {
      throw Error(`Could not get channel with id: '${channelId}' because guild is undefined`);
    }

    const channel: GuildBasedChannel | undefined = this.guild.channels.cache.get(channelId);
    if (!channel) {
      throw Error(`Could not find server channel with id: '${channelId}'`);
    }

    if (channel.isTextBased()) {
      return channel as TextChannel;
    } else {
      throw Error(`The channel with id: '${channelId}' is not a text channel`);
    }
  }

  private async clearServerInfoChannel(): Promise<void> {
    if (!this.serverInfoChannel) {
      return;
    }

    const messages = await this.serverInfoChannel.messages.fetch();

    for (const [_, message] of messages) {
      if (!this.isBotMessage(message)) {
        this.deleteMessage(message);
      }
    }
  }

  private async clearPlayerInfoChannel(): Promise<void> {
    if (!this.playerInfoChannel) {
      return;
    }

    const messages = await this.playerInfoChannel.messages.fetch();

    for (const [_, message] of messages) {
      if (!this.isBotMessage(message)) {
        this.deleteMessage(message);
      }
    }
  }

  private isBotMessage(message: Message): boolean {
    if (message.id === this.serverInfoMessage?.id) {
      return true;
    }

    for (const playerInfoMessage of this.playerInfoMessages) {
      if (message.id === playerInfoMessage.id) {
        return true;
      }
    }

    return false;
  }
}
