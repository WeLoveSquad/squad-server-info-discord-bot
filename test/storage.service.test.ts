import { expect } from "chai";
import fs from "fs";
import { container } from "tsyringe";
import { ServerAddress } from "../src/model/server-address.model.js";
import { StorageService } from "../src/services/storage.service.js";

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
    });

    it("loads empty storage correctly", () => {
      const storageService = container.resolve(StorageService);
      const servers = storageService.getServers();

      expect(servers.length).to.equal(0);
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
        '{"servers":["45.91.103.14:27165","45.91.103.15:27165"]}'
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
        '{"servers":["45.91.103.14:27165","45.91.103.15:27165","45.91.103.16:27165"]}'
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

      await storageService.addServer(server1);
      await storageService.addServer(server2);

      expect(getStorageFileContent()).to.equal(
        '{"servers":["45.91.103.14:27165","45.91.103.15:27165"]}'
      );
      expect(storageService.getServers().length).to.equal(2);
      expect(await storageService.removeServerAtPosition(1)).is.true;

      expect(storageService.getServers().length).to.equal(1);
      expect(storageService.getServers()[0].equals(server1)).is.true;
      expect(getStorageFileContent()).to.equal('{"servers":["45.91.103.14:27165"]}');

      expect(await storageService.removeServerAtPosition(0)).is.true;
      expect(storageService.getServers().length).to.equal(0);
      expect(getStorageFileContent()).to.equal('{"servers":[]}');
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
});

const removeStorage = (): void => {
  fs.rmSync(STORAGE_DIR_PATH, { recursive: true, force: true });
};

const createMockStorage = (): void => {
  fs.mkdirSync(STORAGE_DIR_PATH, { recursive: true });

  fs.writeFileSync(
    STORAGE_FILE_PATH,
    JSON.stringify({ servers: ["45.91.103.14:27165", "45.91.103.15:27165"] }),
    "utf-8"
  );
};

const getStorageFileContent = (): string => {
  return fs.readFileSync(STORAGE_FILE_PATH, "utf-8");
};
