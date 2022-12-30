import config from "config";
import EventEmitter from "events";
import fs from "fs";
import { singleton } from "tsyringe";
import { ServerAddress } from "../model/server-address.model.js";
import { Logger } from "./logger.service.js";

@singleton()
export class StorageService extends EventEmitter {
  public static readonly STORAGE_UPDATED_EVENT = "storageUpdated";

  private servers: ServerAddress[] = [];

  private storageDirectoryPath: string;
  private storageFilePath: string;
  private storagefileName = "storage.json";

  constructor(private logger: Logger) {
    super();

    this.storageDirectoryPath = config.get<string>("storage.path");
    this.storageFilePath = `${this.storageDirectoryPath}/${this.storagefileName}`;
    this.logger.debug("Will store servers in file: [%s]", this.storageFilePath);

    if (fs.existsSync(this.storageFilePath)) {
      this.logger.info("Found storage file: [%s]", this.storageFilePath);
      const storage = JSON.parse(fs.readFileSync(this.storageFilePath, "utf-8"));

      for (const server of storage.servers) {
        this.logger.verbose("Loaded [%s] from storage", server);
        this.servers.push(new ServerAddress(server));
      }
    } else {
      this.logger.info(
        "Storage directory at [%s] does not exist yet and no servers were loaded",
        this.storageDirectoryPath
      );
    }
  }

  getServers(): ServerAddress[] {
    return [...this.servers];
  }

  async addServer(serverAddress: ServerAddress): Promise<void> {
    this.servers.push(serverAddress);
    this.logger.info("Added [%s] to storage", serverAddress.toString());

    await this.updateStorage();
    this.emit(StorageService.STORAGE_UPDATED_EVENT);
  }

  async removeServer(serverAddress: ServerAddress): Promise<boolean> {
    for (let i = 0; i < this.servers.length; i++) {
      if (this.servers[i].equals(serverAddress)) {
        this.servers.splice(i, 1);
        this.logger.info("Removed [%s] from storage", serverAddress.toString());

        await this.updateStorage();
        this.emit(StorageService.STORAGE_UPDATED_EVENT);
        return true;
      }
    }

    this.logger.info(
      "[%s] was not found in the storage and could not be removed",
      serverAddress.toString()
    );
    return false;
  }

  contains(serverAddress: ServerAddress): boolean {
    for (const server of this.servers) {
      if (server.equals(serverAddress)) {
        return true;
      }
    }

    return false;
  }

  private async updateStorage(): Promise<void> {
    if (!fs.existsSync(this.storageDirectoryPath)) {
      this.logger.info("Storage directory: [%s] does not exist yet. Attempting to create it");
      try {
        await fs.promises.mkdir(this.storageDirectoryPath, { recursive: true });
        this.logger.info(
          "Successfully created storage directory at [%s]",
          this.storageDirectoryPath
        );
      } catch (error: any) {
        throw new Error(`Could not create storage file at [${this.storageDirectoryPath}]`);
      }
    }

    const serverAddresses = [];

    for (const server of this.servers) {
      this.logger.verbose("Saving [%s] to storage", server.toString());
      serverAddresses.push(server.toString());
    }

    await fs.promises.writeFile(
      `${this.storageFilePath}`,
      JSON.stringify({ servers: serverAddresses }),
      "utf-8"
    );
  }
}
