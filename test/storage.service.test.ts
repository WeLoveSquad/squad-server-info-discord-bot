import fs from "fs";
import { container } from "tsyringe";
import { ServerAddress } from "../src/model/server-address.model.js";
import { StorageService } from "../src/services/storage.service.js";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
const expect = chai.expect;

const STORAGE_DIR_PATH = "./storage";
const STORAGE_FILE_PATH = "./storage/storage.json";

describe("StorageService", () => {
  before(() => {
    removeStorage();
  });

  afterEach(() => {
    removeStorage();
    container.reset();
  });

  describe("constructor", () => {
    it("loads storage correctly", () => {
      createMockStorage();

      const storageService = container.resolve(StorageService);
      const servers = storageService.getServers();

      expect(servers.length).to.equal(2);
      expect(servers[0].toString()).to.equal("45.91.103.14:27165");
      expect(servers[1].toString()).to.equal("45.91.103.15:27165");
      expect(storageService.getGuildId()).to.equal("123456789");
      expect(storageService.getChannelId()).to.equal("987654321");
      expect(storageService.getUpdateIntervalSec()).to.equal(30);
      expect(storageService.getTimeZone()).to.equal("Europe/Brussels");
    });

    it("loads empty storage correctly", () => {
      const storageService = container.resolve(StorageService);
      const servers = storageService.getServers();

      expect(servers.length).to.equal(0);
      expect(storageService.getGuildId()).undefined;
      expect(storageService.getChannelId()).undefined;
      expect(storageService.getUpdateIntervalSec()).to.equal(15);
      expect(storageService.getTimeZone()).to.equal("Europe/Berlin");
    });

    it("invalid storage uses default values", () => {
      fs.mkdirSync(STORAGE_DIR_PATH, { recursive: true });
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify({ invalid: "storage" }), "utf-8");

      const storageService = container.resolve(StorageService);
      const servers = storageService.getServers();

      expect(servers.length).to.equal(0);
      expect(storageService.getGuildId()).undefined;
      expect(storageService.getChannelId()).undefined;
      expect(storageService.getUpdateIntervalSec()).to.equal(15);
      expect(storageService.getTimeZone()).to.equal("Europe/Berlin");
    });
  });

  describe("getServers", () => {
    it("returns all servers", async () => {
      const storageService = container.resolve(StorageService);
      const server1 = new ServerAddress("45.91.103.14:27165");
      const server2 = new ServerAddress("45.91.103.15:27165");

      await storageService.addServer(server1);
      await storageService.addServer(server2);

      const servers = storageService.getServers();

      expect(servers.length).to.equal(2);
      expect(servers[0].equals(server1)).to.true;
      expect(servers[1].equals(server2)).to.true;
    });

    it("returns copy instead of reference", async () => {
      const storageService = container.resolve(StorageService);
      const server1 = new ServerAddress("45.91.103.14:27165");
      const server2 = new ServerAddress("45.91.103.15:27165");

      await storageService.addServer(server1);
      await storageService.addServer(server2);

      const servers = storageService.getServers();
      expect(servers.length).to.equal(2);

      servers.push(new ServerAddress("45.91.103.16:27165"));
      expect(servers.length).to.equal(3);
      expect(storageService.getServers().length).to.equal(2);
    });
  });

  describe("addServer", () => {
    it("adds servers correctly to empty storage", async () => {
      const storageService = container.resolve(StorageService);

      expect(fs.existsSync(STORAGE_FILE_PATH)).is.false;

      const server1 = new ServerAddress("45.91.103.14:27165");
      const server2 = new ServerAddress("45.91.103.15:27165");

      await storageService.addServer(server1);

      expect(fs.existsSync(STORAGE_FILE_PATH)).is.true;

      await storageService.addServer(server2);
      const servers = storageService.getServers();

      expect(getStorageFileContent()).to.equal(
        '{"servers":["45.91.103.14:27165","45.91.103.15:27165"],"updateIntervalSec":15,"timeZone":"Europe/Berlin"}'
      );
      expect(servers.length).to.equal(2);
      expect(servers[0].toString()).to.equal("45.91.103.14:27165");
      expect(servers[1].toString()).to.equal("45.91.103.15:27165");
    });

    it("adds servers correctly to existing storage", async () => {
      createMockStorage();

      const storageService = container.resolve(StorageService);
      expect(fs.existsSync(STORAGE_FILE_PATH)).is.true;

      await storageService.addServer(new ServerAddress("45.91.103.16:27165"));
      const servers = storageService.getServers();

      expect(getStorageFileContent()).to.equal(
        '{"guildId":"123456789","channelId":"987654321","servers":["45.91.103.14:27165","45.91.103.15:27165","45.91.103.16:27165"],"updateIntervalSec":30,"timeZone":"Europe/Brussels"}'
      );
      expect(servers.length).to.equal(3);
      expect(servers[0].toString()).to.equal("45.91.103.14:27165");
      expect(servers[1].toString()).to.equal("45.91.103.15:27165");
      expect(servers[2].toString()).to.equal("45.91.103.16:27165");
    });
  });

  describe("removeServerAtPosition", () => {
    it("remove position too small", async () => {
      const storageService = container.resolve(StorageService);
      await storageService.addServer(new ServerAddress("45.91.103.14:27165"));
      await storageService.addServer(new ServerAddress("45.91.103.15:27165"));

      expect(await storageService.removeServerAtPosition(2)).is.false;
    });

    it("remove position too big", async () => {
      const storageService = container.resolve(StorageService);
      await storageService.addServer(new ServerAddress("45.91.103.14:27165"));
      await storageService.addServer(new ServerAddress("45.91.103.15:27165"));

      expect(await storageService.removeServerAtPosition(-1)).is.false;
    });

    it("remove from empty storage", async () => {
      const storageService = container.resolve(StorageService);

      expect(await storageService.removeServerAtPosition(0)).is.false;
    });

    it("remove valid position", async () => {
      const storageService = container.resolve(StorageService);

      const server1 = new ServerAddress("45.91.103.14:27165");
      const server2 = new ServerAddress("45.91.103.15:27165");

      await storageService.initGuildAndChannel("123", "321");
      await storageService.addServer(server1);
      await storageService.addServer(server2);

      expect(getStorageFileContent()).to.equal(
        '{"guildId":"123","channelId":"321","servers":["45.91.103.14:27165","45.91.103.15:27165"],"updateIntervalSec":15,"timeZone":"Europe/Berlin"}'
      );
      expect(storageService.getServers().length).to.equal(2);
      expect(await storageService.removeServerAtPosition(1)).is.true;

      expect(storageService.getServers().length).to.equal(1);
      expect(storageService.getServers()[0].equals(server1)).is.true;
      expect(getStorageFileContent()).to.equal(
        '{"guildId":"123","channelId":"321","servers":["45.91.103.14:27165"],"updateIntervalSec":15,"timeZone":"Europe/Berlin"}'
      );

      expect(await storageService.removeServerAtPosition(0)).is.true;
      expect(storageService.getServers().length).to.equal(0);
      expect(getStorageFileContent()).to.equal(
        '{"guildId":"123","channelId":"321","servers":[],"updateIntervalSec":15,"timeZone":"Europe/Berlin"}'
      );
    });
  });

  describe("contains", () => {
    it("contains true", async () => {
      const storageService = container.resolve(StorageService);

      const server1 = new ServerAddress("45.91.103.14:27165");
      const server2 = new ServerAddress("45.91.103.15:27165");

      await storageService.addServer(server1);
      await storageService.addServer(server2);

      expect(storageService.contains(server1)).is.true;
      expect(storageService.contains(server2)).is.true;
      expect(storageService.contains(new ServerAddress("45.91.103.14:27165"))).is.true;
    });

    it("contains false", async () => {
      const storageService = container.resolve(StorageService);

      const server1 = new ServerAddress("45.91.103.14:27165");
      const server2 = new ServerAddress("45.91.103.15:27165");

      await storageService.addServer(server1);

      expect(storageService.contains(server2)).is.false;
    });
  });

  describe("initGuildAndChannel", () => {
    it("saves guildId and channelId correctly", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.initGuildAndChannel("123", "321");

      expect(getStorageFileContent()).to.equal(
        '{"guildId":"123","channelId":"321","servers":[],"updateIntervalSec":15,"timeZone":"Europe/Berlin"}'
      );
    });

    it("overrides guildId and channelId correctly", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.initGuildAndChannel("123", "321");

      expect(getStorageFileContent()).to.equal(
        '{"guildId":"123","channelId":"321","servers":[],"updateIntervalSec":15,"timeZone":"Europe/Berlin"}'
      );

      await storageService.initGuildAndChannel("567", "765");

      expect(getStorageFileContent()).to.equal(
        '{"guildId":"567","channelId":"765","servers":[],"updateIntervalSec":15,"timeZone":"Europe/Berlin"}'
      );
    });
  });

  describe("isChannelInitialized", () => {
    it("returns true when initialized", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.initGuildAndChannel("123", "321");

      expect(storageService.isChannelInitialized()).is.true;
    });
    it("returns false when not initialized", async () => {
      const storageService = container.resolve(StorageService);

      expect(storageService.isChannelInitialized()).is.false;
    });
  });

  describe("getGuildId", async () => {
    it("returns correct valuy", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.initGuildAndChannel("123", "321");

      expect(storageService.getGuildId()).to.equal("123");
    });

    it("returns undefined", async () => {
      const storageService = container.resolve(StorageService);

      expect(storageService.getGuildId()).is.undefined;
    });
  });

  describe("getChannelId", () => {
    it("returns correct valuy", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.initGuildAndChannel("123", "321");

      expect(storageService.getChannelId()).to.equal("321");
    });

    it("returns undefined", async () => {
      const storageService = container.resolve(StorageService);

      expect(storageService.getChannelId()).is.undefined;
    });
  });

  describe("setUpdateIntervalSec", () => {
    it("sets interval correctly", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.setUpdateIntervalSec(30);

      expect(getStorageFileContent()).to.equal(
        '{"servers":[],"updateIntervalSec":30,"timeZone":"Europe/Berlin"}'
      );
    });

    it("too small interval throws error", async () => {
      const storageService = container.resolve(StorageService);

      return expect(storageService.setUpdateIntervalSec(4)).to.be.rejectedWith(
        "Interval cannot be smaller than 5 seconds"
      );
    });
  });

  describe("getUpdateIntervalSec", () => {
    it("returns interval correctly", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.setUpdateIntervalSec(30);

      expect(storageService.getUpdateIntervalSec()).to.equal(30);
    });
  });

  describe("setTimeZone", () => {
    it("sets time zone correctly", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.setTimeZone("America/New_York");

      expect(getStorageFileContent()).to.equal(
        '{"servers":[],"updateIntervalSec":15,"timeZone":"America/New_York"}'
      );
    });

    it("invalid time zone throws error", () => {
      const storageService = container.resolve(StorageService);

      return expect(storageService.setTimeZone("America/Invalid_Zone")).to.be.rejectedWith(
        "America/Invalid_Zone is not a valid IANA time zone"
      );
    });
  });

  describe("getTimeZone", () => {
    it("returns time zone correctly", async () => {
      const storageService = container.resolve(StorageService);

      await storageService.setTimeZone("America/New_York");

      expect(storageService.getTimeZone()).to.equal("America/New_York");
    });
  });
});

const removeStorage = (): void => {
  fs.rmSync(STORAGE_DIR_PATH, { recursive: true, force: true });
};

const createMockStorage = (): void => {
  fs.mkdirSync(STORAGE_DIR_PATH, { recursive: true });

  const storage = {
    guildId: "123456789",
    channelId: "987654321",
    servers: ["45.91.103.14:27165", "45.91.103.15:27165"],
    updateIntervalSec: 30,
    timeZone: "Europe/Brussels",
  };

  fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(storage), "utf-8");
};

const getStorageFileContent = (): string => {
  return fs.readFileSync(STORAGE_FILE_PATH, "utf-8");
};
