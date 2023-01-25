import EventEmitter from "events";
import fs from "fs";
import { DateTime } from "luxon";
import { singleton } from "tsyringe";
import { SquadServer } from "../model/squad-server.model.js";
import { Logger } from "./logger.service.js";

@singleton()
export class StorageService extends EventEmitter {
  private static readonly STORAGE_DIR_PATH = "./storage";
  private static readonly STORAGE_FILE_PATH = "./storage/storage.json";

  public static readonly SERVERS_UPDATED_EVENT = "serversUpdated";
  public static readonly INTERVAL_UPDATED_EVENT = "intervalUpdated";
  public static readonly CHANNEL_UPDATED_EVENT = "channelUpdated";
  public static readonly TIME_ZONE_UPDATED_EVENT = "timeZoneUpdated";

  private guildId: string | undefined;
  private channelId: string | undefined;
  private servers: SquadServer[] = [];
  private updateIntervalSec: number = 15;
  private timeZone: string = "Europe/Berlin";

  constructor(private logger: Logger) {
    super();

    this.logger.debug("Will store storage in file: [%s]", StorageService.STORAGE_FILE_PATH);

    if (fs.existsSync(StorageService.STORAGE_FILE_PATH)) {
      this.logger.info("Found storage file: [%s]", StorageService.STORAGE_FILE_PATH);
      const storage = JSON.parse(fs.readFileSync(StorageService.STORAGE_FILE_PATH, "utf-8"));

      if (!storage) {
        this.logger.error(
          "An error occured while loading the storage. Will use the default values and override the storage on the next save"
        );
        return;
      }

      for (const server of storage.servers ?? []) {
        this.logger.verbose("Loaded [%s] from storage", server);

        const ip = server.ip;
        const queryPort = server.queryPort;

        if (ip && queryPort) {
          this.servers.push(
            new SquadServer({
              ip: ip,
              queryPort: queryPort,
              rconPort: server.rconPort,
              rconPassword: server.rconPassword,
              showPlayers: server.showPlayers ?? false,
            })
          );
        }
      }

      this.guildId = storage.guildId;
      this.channelId = storage.channelId;
      this.updateIntervalSec = storage.updateIntervalSec ?? 15;
      this.timeZone = storage.timeZone ?? "Europe/Berlin";

      this.logger.verbose(
        "Loaded storage. guildId: [%s], channelId: [%s], servers: [%s], interval: [%s], timeZone: [%s]",
        this.guildId,
        this.channelId,
        this.servers.map((server) => server.toString()),
        this.updateIntervalSec,
        this.timeZone
      );
    } else {
      this.logger.info(
        "Storage file at [%s] does not exist yet and no servers were loaded",
        StorageService.STORAGE_FILE_PATH
      );
    }
  }

  getServers(): SquadServer[] {
    return [...this.servers];
  }

  async addServer(server: SquadServer): Promise<void> {
    this.servers.push(server);
    this.logger.info("Added [%s] to storage", server.toString());

    await this.updateStorage();
    this.emit(StorageService.SERVERS_UPDATED_EVENT);
  }

  async removeServerAtPosition(position: number): Promise<boolean> {
    if (position < 0 || position >= this.servers.length) {
      this.logger.info(
        "Address at position: [%d] is not a valid position in the storage and could not be removed",
        position
      );
      return false;
    }

    const removedAddress = this.servers.splice(position, 1)[0];
    removedAddress.dispose();
    this.logger.info(
      "Removed [%s] at position: [%d] from storage and disposed the Rcon connection",
      removedAddress.toString(),
      position
    );

    await this.updateStorage();
    this.emit(StorageService.SERVERS_UPDATED_EVENT);
    return true;
  }

  async setShowPlayers(position: number, show: boolean): Promise<boolean> {
    if (position < 0 || position >= this.servers.length) {
      this.logger.info(
        "Address at position: [%d] is not a valid position in the storage",
        position
      );
      return false;
    }

    this.servers[position].setShowPlayers(show);
    this.logger.info(
      "Set showPlayers to: [%s] for server: [%s] at position: [%d] from storage and disposed the Rcon connection",
      show,
      this.servers[position].toString(),
      position
    );

    await this.updateStorage();
    this.emit(StorageService.SERVERS_UPDATED_EVENT);
    return true;
  }

  contains(squadServer: SquadServer): boolean {
    for (const server of this.servers) {
      if (server.equals(squadServer)) {
        return true;
      }
    }

    return false;
  }

  async initGuildAndChannel(guildId: string, channelId: string): Promise<void> {
    this.guildId = guildId;
    this.channelId = channelId;
    await this.updateStorage();
    this.emit(StorageService.CHANNEL_UPDATED_EVENT);
  }

  isChannelInitialized(): boolean {
    return this.guildId !== undefined && this.channelId !== undefined;
  }

  getGuildId(): string | undefined {
    return this.guildId;
  }

  getChannelId(): string | undefined {
    return this.channelId;
  }

  async setUpdateIntervalSec(interval: number) {
    if (interval < 5) {
      throw new Error("Interval cannot be smaller than 5 seconds");
    }

    this.updateIntervalSec = interval;
    await this.updateStorage();
    this.emit(StorageService.INTERVAL_UPDATED_EVENT);
  }

  getUpdateIntervalSec(): number {
    return this.updateIntervalSec;
  }

  async setTimeZone(timeZone: string) {
    const date = DateTime.local().setZone(timeZone);
    if (!date.isValid) {
      throw new Error(`${timeZone} is not a valid IANA time zone`);
    }

    this.timeZone = timeZone;
    await this.updateStorage();
    this.emit(StorageService.TIME_ZONE_UPDATED_EVENT);
  }

  getTimeZone(): string {
    return this.timeZone;
  }

  private async updateStorage(): Promise<void> {
    if (!fs.existsSync(StorageService.STORAGE_DIR_PATH)) {
      this.logger.info(
        "Storage directory: [%s] does not exist yet. Attempting to create it",
        StorageService.STORAGE_DIR_PATH
      );
      try {
        await fs.promises.mkdir(StorageService.STORAGE_DIR_PATH, { recursive: true });
        this.logger.info(
          "Successfully created storage directory at [%s]",
          StorageService.STORAGE_DIR_PATH
        );
      } catch (error: any) {
        throw new Error(`Could not create storage file at [${StorageService.STORAGE_DIR_PATH}]`);
      }
    }

    const servers = [];

    for (const server of this.servers) {
      servers.push({
        ip: server.ip,
        queryPort: server.queryPort,
        rconPort: server.rconPort,
        rconPassword: server.rconPassword,
        showPlayers: server.showPlayers,
      });
    }

    const storage = {
      guildId: this.guildId,
      channelId: this.channelId,
      servers: servers,
      updateIntervalSec: this.updateIntervalSec,
      timeZone: this.timeZone,
    };

    this.logger.verbose("Saving storage: [%s]", JSON.stringify(storage));
    await fs.promises.writeFile(
      `${StorageService.STORAGE_FILE_PATH}`,
      JSON.stringify(storage),
      "utf-8"
    );
  }
}
