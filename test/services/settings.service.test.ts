import fs from "fs";
import { container } from "tsyringe";
import { SettingsService } from "../../src/services/settings.service.js";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
const expect = chai.expect;

const SETTINGS_DIR_PATH = "./settings";
const SETTINGS_FILE_PATH = "./settings/settings.json";

describe("SettingsService", () => {
  beforeEach(async () => {
    await removeSettings();
  });

  afterEach(async () => {
    await removeSettings();
    container.reset();
  });

  describe("constructor", () => {
    it("empty storage uses default values", () => {
      const settingsService = container.resolve(SettingsService);

      expect(settingsService.getGuildId()).to.be.undefined;
      expect(settingsService.getServerChannelId()).to.be.undefined;
      expect(settingsService.getPlayerChannelId()).to.be.undefined;
      expect(settingsService.getUpdateIntervalSec()).to.equal(15);
      expect(settingsService.getTimeZone()).to.equal("Europe/Berlin");
      expect(settingsService.showNextLayer()).to.be.true;
      expect(settingsService.showSquadNames()).to.be.true;
    });

    it("invalid storage uses default values", () => {
      fs.mkdirSync(SETTINGS_DIR_PATH, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify({ invalid: "storage" }), "utf-8");

      const settingsService = container.resolve(SettingsService);

      expect(settingsService.getGuildId()).to.be.undefined;
      expect(settingsService.getServerChannelId()).to.be.undefined;
      expect(settingsService.getPlayerChannelId()).to.be.undefined;
      expect(settingsService.getUpdateIntervalSec()).to.equal(15);
      expect(settingsService.getTimeZone()).to.equal("Europe/Berlin");
      expect(settingsService.showNextLayer()).to.be.true;
      expect(settingsService.showSquadNames()).to.be.true;
    });
  });

  describe("initGuildAndServerChannel", () => {
    it("saves guildId and serverChannelId correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("overrides guildId and serverChannelId correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );

      await settingsService.initGuildAndServerChannel("567", "765");

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"567","serverChannelId":"765","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });
  });

  describe("initPlayerChannel", () => {
    it("saves playerChannelId correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");
      await settingsService.initPlayerChannel("456");

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","playerChannelId":"456","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("overrides playerChannelId correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");
      await settingsService.initPlayerChannel("456");

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","playerChannelId":"456","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );

      await settingsService.initPlayerChannel("789");

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","playerChannelId":"789","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("throws SettingsServiceError if serverChannel not initialized", () => {
      const settingsService = container.resolve(SettingsService);

      return expect(settingsService.initPlayerChannel("123")).to.be.rejectedWith(
        "Cannot initialize the player-info-channel before initializing the server-info-channel"
      );
    });
  });

  describe("isServerChannelInitialized", () => {
    it("returns true when initialized", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");

      expect(settingsService.isServerChannelInitialized()).is.true;
    });

    it("returns false when not initialized", async () => {
      const settingsService = container.resolve(SettingsService);

      expect(settingsService.isServerChannelInitialized()).is.false;
    });
  });

  describe("isPlayerChannelInitialized", () => {
    it("returns true when initialized", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");
      await settingsService.initPlayerChannel("456");

      expect(settingsService.isPlayerChannelInitialized()).is.true;
    });

    it("returns false when not initialized", async () => {
      const settingsService = container.resolve(SettingsService);

      expect(settingsService.isPlayerChannelInitialized()).is.false;
    });

    it("returns false when only serverChannel initialized", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");

      expect(settingsService.isServerChannelInitialized()).is.true;
      expect(settingsService.isPlayerChannelInitialized()).is.false;
    });
  });

  describe("getGuildId", async () => {
    it("returns correct valuy", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");

      expect(settingsService.getGuildId()).to.equal("123");
    });

    it("returns undefined", async () => {
      const settingsService = container.resolve(SettingsService);

      expect(settingsService.getGuildId()).is.undefined;
    });
  });

  describe("getServerChannelId", () => {
    it("returns correct valuy", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");

      expect(settingsService.getServerChannelId()).to.equal("321");
    });

    it("returns undefined", async () => {
      const settingsService = container.resolve(SettingsService);

      expect(settingsService.getServerChannelId()).is.undefined;
    });
  });

  describe("getPlayerChannelId", () => {
    it("returns correct valuy", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");
      await settingsService.initPlayerChannel("456");

      expect(settingsService.getPlayerChannelId()).to.equal("456");
    });

    it("returns undefined", async () => {
      const settingsService = container.resolve(SettingsService);

      expect(settingsService.getServerChannelId()).is.undefined;
    });
  });

  describe("removePlayerChannel", () => {
    it("removes correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");
      await settingsService.initPlayerChannel("456");

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","playerChannelId":"456","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );

      await settingsService.removePlayerChannel();

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("throws SettingsServiceError if playerChannel not initialized", async () => {
      const settingsService = container.resolve(SettingsService);

      return expect(settingsService.removePlayerChannel()).to.be.rejectedWith(
        "Channel for player information has not been initialized yet!"
      );
    });
  });

  describe("setUpdateIntervalSec", () => {
    it("sets interval correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setUpdateIntervalSec(10);

      expect(getSettingsFileContent()).to.equal(
        '{"updateIntervalSec":10,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("too small interval throws error", async () => {
      const settingsService = container.resolve(SettingsService);

      return expect(settingsService.setUpdateIntervalSec(9)).to.be.rejectedWith(
        "Interval cannot be smaller than 10 seconds"
      );
    });
  });

  describe("getUpdateIntervalSec", () => {
    it("returns interval correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setUpdateIntervalSec(30);

      expect(settingsService.getUpdateIntervalSec()).to.equal(30);
    });
  });

  describe("setTimeZone", () => {
    it("sets time zone correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setTimeZone("America/New_York");

      expect(getSettingsFileContent()).to.equal(
        '{"updateIntervalSec":15,"timeZone":"America/New_York","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("invalid time zone throws error", () => {
      const settingsService = container.resolve(SettingsService);

      return expect(settingsService.setTimeZone("America/Invalid_Zone")).to.be.rejectedWith(
        "'America/Invalid_Zone' is not a valid IANA time zone"
      );
    });
  });

  describe("getTimeZone", () => {
    it("returns time zone correctly", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setTimeZone("America/New_York");

      expect(settingsService.getTimeZone()).to.equal("America/New_York");
    });
  });

  describe("setShowNextLayer", () => {
    it("sets showNextLayer true", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowNextLayer(true);

      expect(getSettingsFileContent()).to.equal(
        '{"updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("sets showNextLayer false", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowNextLayer(false);

      expect(getSettingsFileContent()).to.equal(
        '{"updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":false,"showSquadNames":true}'
      );
    });
  });

  describe("showNextLayer", () => {
    it("returns showNextLayer true", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowNextLayer(true);

      expect(settingsService.showNextLayer()).to.be.true;
    });

    it("returns showNextLayer false", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowNextLayer(false);

      expect(settingsService.showNextLayer()).to.be.false;
    });
  });

  describe("setShowSquadNames", () => {
    it("sets showSquadNames true", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowSquadNames(true);

      expect(getSettingsFileContent()).to.equal(
        '{"updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });

    it("sets showSquadNames false", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowSquadNames(false);

      expect(getSettingsFileContent()).to.equal(
        '{"updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":false}'
      );
    });
  });

  describe("setShowSquadNames", () => {
    it("returns showSquadNames true", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowSquadNames(true);

      expect(settingsService.showSquadNames()).to.be.true;
    });

    it("returns showSquadNames false", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.setShowSquadNames(false);

      expect(settingsService.showSquadNames()).to.be.false;
    });
  });

  describe("reset", () => {
    it("resets all settings to default", async () => {
      const settingsService = container.resolve(SettingsService);

      await settingsService.initGuildAndServerChannel("123", "321");
      await settingsService.initPlayerChannel("456");
      await settingsService.setUpdateIntervalSec(30);
      await settingsService.setTimeZone("America/New_York");
      await settingsService.setShowNextLayer(false);
      await settingsService.setShowSquadNames(false);

      expect(getSettingsFileContent()).to.equal(
        '{"guildId":"123","serverChannelId":"321","playerChannelId":"456","updateIntervalSec":30,"timeZone":"America/New_York","showNextLayer":false,"showSquadNames":false}'
      );

      await settingsService.resetSettings();

      expect(settingsService.isServerChannelInitialized()).to.be.false;
      expect(settingsService.isPlayerChannelInitialized()).to.be.false;
      expect(settingsService.getUpdateIntervalSec()).to.equal(15);
      expect(settingsService.getTimeZone()).to.equal("Europe/Berlin");
      expect(settingsService.showNextLayer()).to.be.true;
      expect(settingsService.showSquadNames()).to.be.true;

      expect(getSettingsFileContent()).to.equal(
        '{"updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true}'
      );
    });
  });
});

const removeSettings = async (): Promise<void> => {
  await fs.promises.rm(SETTINGS_DIR_PATH, { recursive: true, force: true });
};

const getSettingsFileContent = (): string => {
  return fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
};
