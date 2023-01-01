import EventEmitter from "events";
import fs from "fs";
import { singleton } from "tsyringe";
import { ServerAddress } from "../model/server-address.model.js";
import { Logger } from "./logger.service.js";

@singleton()
export class StorageService extends EventEmitter {
  private static readonly STORAGE_DIR_PATH = "./storage";
  private static readonly STORAGE_FILE_PATH = "./storage/storage.json";

  public static readonly STORAGE_UPDATED_EVENT = "storageUpdated";

  private servers: ServerAddress[] = [];

  constructor(private logger: Logger) {
    super();

    this.logger.debug("Will store servers in file: [%s]", StorageService.STORAGE_FILE_PATH);

    if (fs.existsSync(StorageService.STORAGE_FILE_PATH)) {
      this.logger.info("Found storage file: [%s]", StorageService.STORAGE_FILE_PATH);
      const storage = JSON.parse(fs.readFileSync(StorageService.STORAGE_FILE_PATH, "utf-8"));

      for (const server of storage.servers) {
        this.logger.verbose("Loaded [%s] from storage", server);
        this.servers.push(new ServerAddress(server));
      }
    } else {
      this.logger.info(
        "Storage file at [%s] does not exist yet and no servers were loaded",
        StorageService.STORAGE_FILE_PATH
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
    if (!fs.existsSync(StorageService.STORAGE_DIR_PATH)) {
      this.logger.info("Storage directory: [%s] does not exist yet. Attempting to create it");
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

    const serverAddresses = [];

    for (const server of this.servers) {
      this.logger.verbose("Saving [%s] to storage", server.toString());
      serverAddresses.push(server.toString());
    }

    await fs.promises.writeFile(
      `${StorageService.STORAGE_FILE_PATH}`,
      JSON.stringify({ servers: serverAddresses }),
      "utf-8"
    );
  }
}
