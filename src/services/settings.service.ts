import EventEmitter from "events";
import fs from "fs";
import { DateTime } from "luxon";
import { singleton } from "tsyringe";
import { Settings } from "../model/settings.model.js";
import { Logger } from "./logger.service.js";

export class SettingsServiceError extends Error {}

@singleton()
export class SettingsService extends EventEmitter {
  private static readonly SETTINGS_DIR_PATH = "./settings";
  private static readonly SETTINGS_FILE_PATH = "./settings/settings.json";

  public static readonly SERVER_CHANNEL_UPDATED_EVENT = "serverChannelUpdated";
  public static readonly PLAYER_CHANNEL_UPDATED_EVENT = "playerChannelUpdated";
  public static readonly SETTINGS_UPDATED_EVENT = "settingsUpdated";

  private settings: Settings;

  constructor(private logger: Logger) {
    super();

    this.logger.debug("Will store settings in file: [%s]", SettingsService.SETTINGS_FILE_PATH);

    if (fs.existsSync(SettingsService.SETTINGS_FILE_PATH)) {
      this.logger.info("Found settings file: [%s]", SettingsService.SETTINGS_FILE_PATH);
      const fileContent = fs.readFileSync(SettingsService.SETTINGS_FILE_PATH, "utf-8");

      this.settings = new Settings(fileContent);

      this.logger.verbose("Loaded settings: [%s]", JSON.stringify(this.settings.toJsonString()));
    } else {
      this.logger.info(
        "Settings file at [%s] does not exist yet and default settings will be used",
        SettingsService.SETTINGS_FILE_PATH
      );
      this.settings = new Settings();
    }
  }

  public async initGuildAndServerChannel(guildId: string, channelId: string): Promise<void> {
    this.settings.guildId = guildId;
    this.settings.serverChannelId = channelId;
    await this.updateSettings();
    this.emit(SettingsService.SERVER_CHANNEL_UPDATED_EVENT);
  }

  public async initPlayerChannel(playerChannelId: string): Promise<void> {
    if (!this.settings.guildId || !this.settings.serverChannelId) {
      throw new SettingsServiceError(
        "Cannot initialize the player-info-channel before initializing the server-info-channel"
      );
    }

    this.settings.playerChannelId = playerChannelId;
    await this.updateSettings();
    this.emit(SettingsService.PLAYER_CHANNEL_UPDATED_EVENT);
  }

  public isServerChannelInitialized(): boolean {
    return this.settings.guildId !== undefined && this.settings.serverChannelId !== undefined;
  }

  public isPlayerChannelInitialized(): boolean {
    return this.settings.guildId !== undefined && this.settings.playerChannelId !== undefined;
  }

  public getGuildId(): string | undefined {
    return this.settings.guildId;
  }

  public getServerChannelId(): string | undefined {
    return this.settings.serverChannelId;
  }

  public getPlayerChannelId(): string | undefined {
    return this.settings.playerChannelId;
  }

  public async removePlayerChannel(): Promise<void> {
    if (!this.settings.playerChannelId) {
      throw new SettingsServiceError(
        "Channel for player information has not been initialized yet!"
      );
    }

    this.settings.playerChannelId = undefined;
    await this.updateSettings();
    this.emit(SettingsService.PLAYER_CHANNEL_UPDATED_EVENT);
  }

  public async setUpdateIntervalSec(interval: number): Promise<void> {
    if (interval < 5) {
      throw new SettingsServiceError("Interval cannot be smaller than 5 seconds");
    }

    this.settings.updateIntervalSec = interval;
    await this.updateSettings();
    this.emit(SettingsService.SETTINGS_UPDATED_EVENT);
  }

  public getUpdateIntervalSec(): number {
    return this.settings.updateIntervalSec;
  }

  public async setTimeZone(timeZone: string): Promise<void> {
    const date = DateTime.local().setZone(timeZone);
    if (!date.isValid) {
      throw new SettingsServiceError(`'${timeZone}' is not a valid IANA time zone`);
    }

    this.settings.timeZone = timeZone;
    await this.updateSettings();
    this.emit(SettingsService.SETTINGS_UPDATED_EVENT);
  }

  public getTimeZone(): string {
    return this.settings.timeZone;
  }

  public async setShowNextLayer(show: boolean): Promise<void> {
    this.settings.showNextLayer = show;
    await this.updateSettings();
    this.emit(SettingsService.SETTINGS_UPDATED_EVENT);
  }

  public showNextLayer(): boolean {
    return this.settings.showNextLayer;
  }

  public async setShowSquadNames(show: boolean): Promise<void> {
    this.settings.showSquadNames = show;
    await this.updateSettings();
    this.emit(SettingsService.SETTINGS_UPDATED_EVENT);
  }

  public showSquadNames(): boolean {
    return this.settings.showSquadNames;
  }

  public async reset(): Promise<void> {
    this.settings = new Settings();
    await this.updateSettings();
    this.emit(SettingsService.SETTINGS_UPDATED_EVENT);
  }

  private async updateSettings(): Promise<void> {
    if (!fs.existsSync(SettingsService.SETTINGS_DIR_PATH)) {
      this.logger.info(
        "Settings directory: [%s] does not exist yet. Attempting to create it",
        SettingsService.SETTINGS_DIR_PATH
      );
      try {
        await fs.promises.mkdir(SettingsService.SETTINGS_DIR_PATH, { recursive: true });
        this.logger.info(
          "Successfully created settings directory at [%s]",
          SettingsService.SETTINGS_DIR_PATH
        );
      } catch (error: any) {
        throw new Error(`Could not create settings file at [${SettingsService.SETTINGS_DIR_PATH}]`);
      }
    }

    this.logger.verbose("Saving settings: [%s]", this.settings.toJsonString());
    await fs.promises.writeFile(
      `${SettingsService.SETTINGS_FILE_PATH}`,
      this.settings.toJsonString(),
      "utf-8"
    );
  }
}
