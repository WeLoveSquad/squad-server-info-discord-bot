import { Client, EmbedBuilder, Guild, Message, TextChannel } from "discord.js";
import { Discord, Once } from "discordx";
import { injectable } from "tsyringe";
import { ServerInfo, ServerInfoError } from "../entities/squad-server.entity.js";
import { Team } from "../enums/team.enum.js";
import { Logger } from "../logger/logger.js";
import { ComponentService } from "../services/component.service.js";
import { ServerService } from "../services/server.service.js";
import { SettingsService } from "../services/settings.service.js";

@Discord()
@injectable()
export class InfoChannelHandler {
  private logger = new Logger(InfoChannelHandler.name);

  private guild?: Guild;
  private serverInfoChannel?: TextChannel;
  private serverInfoMessage?: Message;
  private interval?: NodeJS.Timer;

  private playerInfoChannel?: TextChannel;
  private playerInfoMessages: Message[] = [];

  constructor(
    private serverService: ServerService,
    private settingsService: SettingsService,
    private componentService: ComponentService
  ) {}

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
      } catch (error: unknown) {
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
    const serverEmbeds: EmbedBuilder[] = [];
    const playerEmbeds: EmbedBuilder[] = [];

    for (const [index, server] of servers.entries()) {
      const position = index + 1;

      let serverInfo: ServerInfo;
      try {
        serverInfo = await server.getServerInfo();
        serverEmbeds.push(this.componentService.buildServerInfoEmbed(serverInfo, position));
      } catch (error: unknown) {
        if (error instanceof ServerInfoError) {
          serverEmbeds.push(
            this.componentService.buildServerInfoErrorEmbed(server, position, error.message)
          );
        } else {
          serverEmbeds.push(this.componentService.buildServerInfoErrorEmbed(server, position));
        }
        const serverName = server.name ? server.name : `${server.ip}:${server.rconPort}`;

        playerEmbeds.push(
          this.componentService.buildPlayerInfoErrorEmbed(serverName, Team.ONE, position),
          this.componentService.buildPlayerInfoErrorEmbed(serverName, Team.TWO, position)
        );
        continue;
      }

      if (server.rconEnabled && this.settingsService.isPlayerChannelInitialized()) {
        playerEmbeds.push(
          this.componentService.buildPlayerInfoEmbed(serverInfo, Team.ONE, position),
          this.componentService.buildPlayerInfoEmbed(serverInfo, Team.TWO, position)
        );
      }
    }

    try {
      await this.updateInfoMessages(serverEmbeds, playerEmbeds);
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
    await this.updateServerInfoMessage(serverEmbeds);

    if (this.settingsService.isPlayerChannelInitialized()) {
      try {
        await this.updatePlayerInfoMessages(playerEmbeds);
      } catch (error: unknown) {
        console.log(error);
        this.logger.warn(
          "An error occured while updating the player info messages. Will resend all messages"
        );

        await this.updatePlayerInfoMessages(playerEmbeds, true);
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
        components,
      });
    } else {
      try {
        this.logger.debug("Editing server info message [%s]", this.serverInfoMessage.id);
        await this.serverInfoMessage.edit({ embeds: infoEmbeds, components });
      } catch (error: unknown) {
        this.logger.warn(
          "Could not edit server info message with id: [%s] and will send a new message. Error: [%s]",
          this.serverInfoMessage.id,
          error
        );

        this.serverInfoMessage = await this.serverInfoChannel.send({
          embeds: infoEmbeds,
          components,
        });
      }
    }
  }

  private async updatePlayerInfoMessages(
    playerEmbeds: EmbedBuilder[],
    resendAll = false
  ): Promise<void> {
    if (!this.playerInfoChannel) {
      this.logger.error(
        "Cannot update the player info messages because playerInfoChannel is undefined"
      );
      return;
    }

    if (resendAll) {
      this.playerInfoMessages = [];
    }

    const components = [];
    if (this.serverInfoMessage) {
      components.push(this.componentService.buildServerInfoLinkButton(this.serverInfoMessage.id));
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

    this.guild = await this.getGuild(client, guildId);
    this.serverInfoChannel = await this.getDiscordChannel(client, channelId);

    const messages = await this.serverInfoChannel.messages.fetch();

    for (const message of messages.values()) {
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

    const rconServerCount = this.serverService.getRconServerCount();
    const messages = await this.playerInfoChannel.messages.fetch();

    for (const message of messages.values()) {
      if (message.author.id !== client.user?.id) {
        await this.deleteMessage(message);
      } else if (
        message.id !== this.serverInfoMessage?.id &&
        this.playerInfoMessages.length < rconServerCount
      ) {
        this.playerInfoMessages.splice(0, 0, message);
      } else {
        await this.deleteMessage(message);
      }
    }
  }

  private async deleteMessage(message: Message): Promise<void> {
    try {
      await message.delete();
    } catch (error: unknown) {
      this.logger.warn("Could not delete message: [%s]. Error: [%s]", message.id, error);
    }
  }

  private async getGuild(client: Client, guildId: string): Promise<Guild> {
    try {
      return await client.guilds.fetch(guildId);
    } catch (error: unknown) {
      throw new Error(`Could not find guild with id: '${guildId}'. Reason: '${error}'`);
    }
  }

  private async getDiscordChannel(client: Client, channelId: string): Promise<TextChannel> {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new Error(`Could not find text channel with id '${channelId}'`);
    }

    return channel;
  }

  private async clearServerInfoChannel(): Promise<void> {
    if (!this.serverInfoChannel) {
      return;
    }

    const messages = await this.serverInfoChannel.messages.fetch();

    for (const message of messages.values()) {
      if (!this.isBotMessage(message)) {
        this.deleteMessage(message);
      } else if (this.serverInfoMessage && this.serverInfoMessage.id !== message.id) {
        this.deleteMessage(message);
      }
    }
  }

  private async clearPlayerInfoChannel(): Promise<void> {
    if (!this.playerInfoChannel) {
      return;
    }

    const messages = await this.playerInfoChannel.messages.fetch();
    const playerInfoMessageIds = this.playerInfoMessages.map((message) => message.id);

    for (const message of messages.values()) {
      if (!this.isBotMessage(message)) {
        this.deleteMessage(message);
      } else if (playerInfoMessageIds.length > 0 && !playerInfoMessageIds.includes(message.id)) {
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
