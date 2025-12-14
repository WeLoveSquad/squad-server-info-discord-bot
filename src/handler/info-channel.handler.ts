import { Client, DiscordAPIError, EmbedBuilder, Message, TextChannel } from "discord.js";
import { Discord, Once } from "discordx";
import { singleton } from "tsyringe";
import { Logger } from "../logger/logger.js";
import { DiscordComponentService } from "../services/discord-component.service.js";
import { DiscordService } from "../services/discord.service.js";
import { ServerInfoService } from "../services/server-info.service.js";
import { ServerService } from "../services/server.service.js";
import {
  PLAYER_CHANNEL_UPDATED_EVENT,
  SERVER_CHANNEL_UPDATED_EVENT,
  SETTINGS_RESET_EVENT,
  SETTINGS_UPDATED_EVENT,
  SettingsService,
} from "../services/settings.service.js";

const MAX_MESSAGE_EDIT_ATTEMPTS = 5;

@Discord()
@singleton()
export class InfoChannelHandler {
  private logger = new Logger(InfoChannelHandler.name);

  private failedServerInfoEditAttempts = 0;
  private failedPlayerInfoEditAttempts = 0;

  private serverInfoChannel?: TextChannel;
  private serverInfoMessage?: Message;
  private interval?: NodeJS.Timeout;

  private playerInfoChannel?: TextChannel;
  private playerInfoMessages: Message[] = [];

  constructor(
    private serverService: ServerService,
    private serverInfoService: ServerInfoService,
    private settingsService: SettingsService,
    private discordService: DiscordService,
    private discordComponentService: DiscordComponentService
  ) {}

  @Once({ event: "ready" })
  async onceReady(_: unknown, client: Client): Promise<void> {
    await this.initServerInfoChannel(client);
    await this.initPlayerInfoChannel(client);

    this.settingsService.addListener(SERVER_CHANNEL_UPDATED_EVENT, async () => {
      await this.handleServerChannelUpdated(client);
    });

    this.settingsService.addListener(PLAYER_CHANNEL_UPDATED_EVENT, async () => {
      await this.handlePlayerChannelUpdated(client);
    });

    this.settingsService.addListener(SETTINGS_RESET_EVENT, async () => {
      await this.handleSettingsReset();
    });

    this.settingsService.addListener(SETTINGS_UPDATED_EVENT, async () => {
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
      } catch {
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
      await this.discordService.deleteMessage(this.serverInfoMessage);
    }
    this.serverInfoMessage = undefined;

    for (const message of this.playerInfoMessages) {
      await this.discordService.deleteMessage(message);
    }
    this.playerInfoMessages = [];

    this.logger.info(
      "Settings have been reset. Deleted all messages and stopped requesting server information"
    );
  }

  private async startUpdateInterval(): Promise<void> {
    clearInterval(this.interval);

    if (!this.serverInfoChannel) {
      this.logger.info(
        "Will not start the update interval because the server info channel has not been initialized yet"
      );
      return;
    }

    try {
      await this.syncServerInfos();
    } catch (error: unknown) {
      this.logger.error(
        "An unexpected error occurred while syncing the server infos for the first time. Error: [%s]",
        error
      );
    }

    this.interval = setInterval(async () => {
      try {
        await this.clearServerInfoChannel();
        await this.clearPlayerInfoChannel();
        await this.syncServerInfos();
      } catch (error: unknown) {
        this.logger.error(
          "An unexpected error occurred while syncing the server infos. Error: [%s]",
          error
        );
      }
    }, this.settingsService.getUpdateIntervalSec() * 1000);
  }

  private async syncServerInfos(): Promise<void> {
    const servers = this.serverService.getServers();
    const serverInfoEmbeds: EmbedBuilder[] = [];
    const playerInfoEmbeds: EmbedBuilder[] = [];

    for (const [index, server] of servers.entries()) {
      const position = index + 1;

      const serverInfo = await this.serverInfoService.getServerInfo(server);
      const serverInfoEmbed = this.discordComponentService.buildServerInfoEmbed(
        serverInfo,
        position
      );
      serverInfoEmbeds.push(serverInfoEmbed);

      if (this.settingsService.isPlayerChannelInitialized()) {
        const teams = await this.serverInfoService.getTeams(server);
        const [teamOneEmbed, teamTwoEmbed] = this.discordComponentService.buildPlayerInfoEmbeds(
          serverInfo,
          teams,
          position
        );
        playerInfoEmbeds.push(teamOneEmbed, teamTwoEmbed);
      }
    }

    try {
      await this.updateInfoMessages(serverInfoEmbeds, playerInfoEmbeds);
    } catch (error: unknown) {
      this.logger.error(
        "Unexpected error occurred while updating the info messages. Error: [%s]",
        error
      );
    }
  }

  private async updateInfoMessages(
    serverEmbeds: EmbedBuilder[],
    playerEmbeds: EmbedBuilder[]
  ): Promise<void> {
    try {
      await this.updateServerInfoMessage(serverEmbeds);
      this.failedServerInfoEditAttempts = 0;
    } catch (error: unknown) {
      this.failedServerInfoEditAttempts++;
      this.logger.warn(
        "Updating the server info message failed. Attempt %s/%s.",
        this.failedServerInfoEditAttempts,
        MAX_MESSAGE_EDIT_ATTEMPTS
      );
      if (
        (error instanceof DiscordAPIError && error.status === 404) ||
        this.failedServerInfoEditAttempts >= 5
      ) {
        this.logger.error(
          "Could not edit the player info message. Will send a new one during the next sync"
        );
        this.serverInfoMessage = undefined;
        return;
      }
    }

    if (this.settingsService.isPlayerChannelInitialized()) {
      try {
        await this.updatePlayerInfoMessages(playerEmbeds);
        this.failedPlayerInfoEditAttempts = 0;
      } catch (error: unknown) {
        this.failedPlayerInfoEditAttempts++;
        this.logger.warn(
          "Updating the player info message failed. Attempt %s/%s.",
          this.failedServerInfoEditAttempts,
          MAX_MESSAGE_EDIT_ATTEMPTS
        );
        if (
          (error instanceof DiscordAPIError && error.status === 404) ||
          this.failedPlayerInfoEditAttempts >= 5
        ) {
          this.logger.error(
            "Could not edit the server info message and will send a new one during the next sync"
          );
          this.playerInfoMessages = [];
        }
      }
    }
  }

  private async updateServerInfoMessage(serverInfoEmbeds: EmbedBuilder[]): Promise<void> {
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
      const buttonRow = this.discordComponentService.buildPlayerInfoLinkButton(
        this.playerInfoMessages[0].id
      );
      components.push(buttonRow);
    }

    if (!this.serverInfoMessage) {
      this.serverInfoMessage = await this.serverInfoChannel.send({
        embeds: serverInfoEmbeds,
        components,
      });
      return;
    }

    this.logger.debug("Editing server info message [%s]", this.serverInfoMessage.id);
    await this.serverInfoMessage.edit({ embeds: serverInfoEmbeds, components });
  }

  private async updatePlayerInfoMessages(playerEmbeds: EmbedBuilder[]): Promise<void> {
    if (!this.playerInfoChannel) {
      this.logger.error(
        "Cannot update the player info messages because playerInfoChannel is undefined"
      );
      return;
    }

    const components = [];
    if (this.serverInfoMessage) {
      components.push(
        this.discordComponentService.buildServerInfoLinkButton(this.serverInfoMessage.id)
      );
    }

    let embedIndex = 0;
    let messageIndex = 0;
    while (embedIndex < playerEmbeds.length) {
      const embeds = [playerEmbeds[embedIndex]];
      if (embedIndex + 1 < playerEmbeds.length) {
        embeds.push(playerEmbeds[embedIndex + 1]);
      }

      if (messageIndex < this.playerInfoMessages.length) {
        this.logger.debug(
          "Editing player info message [%s]",
          this.playerInfoMessages[messageIndex].id
        );
        await this.playerInfoMessages[messageIndex].edit({
          embeds,
          components,
        });
      } else {
        this.logger.debug("Sending new player info message");
        const message = await this.playerInfoChannel.send({
          embeds,
          components,
        });
        this.playerInfoMessages.push(message);
      }

      embedIndex += 2;
      messageIndex += 1;
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

    this.serverInfoChannel = await this.discordService.loadTextChannel(client, channelId);

    const messages = await this.serverInfoChannel.messages.fetch();

    for (const message of messages.values()) {
      if (!this.serverInfoMessage && message.author.id === client.user?.id) {
        this.serverInfoMessage = message;
      } else {
        await this.discordService.deleteMessage(message);
      }
    }
  }

  private async initPlayerInfoChannel(client: Client): Promise<void> {
    if (!this.serverInfoChannel) {
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

    this.playerInfoChannel = await this.discordService.loadTextChannel(client, playerChannelId);

    const serverCount = this.serverService.getServerCount();
    const messages = await this.playerInfoChannel.messages.fetch();

    for (const message of messages.values()) {
      if (message.author.id !== client.user?.id) {
        await this.discordService.deleteMessage(message);
      } else if (
        message.id !== this.serverInfoMessage?.id &&
        this.playerInfoMessages.length < serverCount
      ) {
        this.playerInfoMessages.splice(0, 0, message);
      } else {
        await this.discordService.deleteMessage(message);
      }
    }
  }

  private async clearServerInfoChannel(): Promise<void> {
    if (!this.serverInfoChannel) {
      return;
    }

    const messages = await this.serverInfoChannel.messages.fetch();

    for (const message of messages.values()) {
      if (!this.isBotMessage(message)) {
        await this.discordService.deleteMessage(message);
      } else if (this.serverInfoMessage && this.serverInfoMessage.id !== message.id) {
        await this.discordService.deleteMessage(message);
      }
    }
  }

  private async clearPlayerInfoChannel(): Promise<void> {
    if (!this.playerInfoChannel) {
      return;
    }

    this.playerInfoMessages.splice(this.serverService.getServerCount());

    const messages = await this.playerInfoChannel.messages.fetch();
    const playerInfoMessageIds = this.playerInfoMessages.map((message) => message.id);

    for (const message of messages.values()) {
      if (!this.isBotMessage(message)) {
        await this.discordService.deleteMessage(message);
      } else if (playerInfoMessageIds.length > 0 && !playerInfoMessageIds.includes(message.id)) {
        await this.discordService.deleteMessage(message);
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
