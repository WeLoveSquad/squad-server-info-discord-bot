import { Settings } from "../../src/model/settings.model.js";

import { expect } from "chai";

describe("Settings", () => {
  describe("constructor", () => {
    it("no parameter uses default values", () => {
      const settings = new Settings();

      expect(settings.guildId).to.be.undefined;
      expect(settings.serverChannelId).to.be.undefined;
      expect(settings.playerChannelId).to.be.undefined;
      expect(settings.updateIntervalSec).to.equal(15);
      expect(settings.timeZone).to.equal("Europe/Berlin");
      expect(settings.showNextLayer).to.be.true;
      expect(settings.showSquadNames).to.be.true;
    });

    it("empty string uses default values", () => {
      const settings = new Settings("");

      expect(settings.guildId).to.be.undefined;
      expect(settings.serverChannelId).to.be.undefined;
      expect(settings.playerChannelId).to.be.undefined;
      expect(settings.updateIntervalSec).to.equal(15);
      expect(settings.timeZone).to.equal("Europe/Berlin");
      expect(settings.showNextLayer).to.be.true;
      expect(settings.showSquadNames).to.be.true;
    });

    it("invalid string uses default values", () => {
      const settings = new Settings('{"random":"json"}');

      expect(settings.guildId).to.be.undefined;
      expect(settings.serverChannelId).to.be.undefined;
      expect(settings.playerChannelId).to.be.undefined;
      expect(settings.updateIntervalSec).to.equal(15);
      expect(settings.timeZone).to.equal("Europe/Berlin");
      expect(settings.showNextLayer).to.be.true;
      expect(settings.showSquadNames).to.be.true;
    });

    it("json settings are parsed correctly", () => {
      const guildId = "1234";
      const serverChannelId = "5678";
      const playerChannelId = "9876";
      const updateIntervalSec = 30;
      const timeZone = "America/New_York";
      const showNextLayer = false;
      const showSquadNames = false;
      const sortSquadsBySize = true;

      const json = {
        guildId: guildId,
        serverChannelId: serverChannelId,
        playerChannelId: playerChannelId,
        updateIntervalSec: updateIntervalSec,
        timeZone: timeZone,
        showNextLayer: showNextLayer,
        showSquadNames: showSquadNames,
        sortSquadsBySize: sortSquadsBySize,
      };

      const jsonString = JSON.stringify(json);

      const settings = new Settings(jsonString);

      expect(settings.guildId).to.equal(guildId);
      expect(settings.serverChannelId).to.equal(serverChannelId);
      expect(settings.playerChannelId).to.equal(playerChannelId);
      expect(settings.updateIntervalSec).to.equal(updateIntervalSec);
      expect(settings.timeZone).to.equal(timeZone);
      expect(settings.showNextLayer).to.be.false;
      expect(settings.showSquadNames).to.be.false;
      expect(settings.sortSquadsBySize).to.be.true;
    });

    it("partial settings are parsed correctly", () => {
      const guildId = "1234";
      const serverChannelId = "5678";
      const playerChannelId = "9876";

      const json = {
        guildId: guildId,
        serverChannelId: serverChannelId,
        playerChannelId: playerChannelId,
      };

      const jsonString = JSON.stringify(json);

      const settings = new Settings(jsonString);

      expect(settings.guildId).to.equal(guildId);
      expect(settings.serverChannelId).to.equal(serverChannelId);
      expect(settings.playerChannelId).to.equal(playerChannelId);
      expect(settings.updateIntervalSec).to.equal(15);
      expect(settings.timeZone).to.equal("Europe/Berlin");
      expect(settings.showNextLayer).to.be.true;
      expect(settings.showSquadNames).to.be.true;
      expect(settings.sortSquadsBySize).to.be.false;
    });
  });

  describe("toJsonString", () => {
    it("returns correct json with all attributes", () => {
      const settings = new Settings();
      settings.guildId = "123";
      settings.serverChannelId = "456";
      settings.playerChannelId = "789";

      const jsonString = settings.toJsonString();

      expect(jsonString).to.equal(
        '{"guildId":"123","serverChannelId":"456","playerChannelId":"789","updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true,"sortSquadsBySize":false,"showCommander":true}'
      );
    });

    it("returns correct json with undefines", () => {
      const settings = new Settings();

      const jsonString = settings.toJsonString();

      expect(jsonString).to.equal(
        '{"updateIntervalSec":15,"timeZone":"Europe/Berlin","showNextLayer":true,"showSquadNames":true,"sortSquadsBySize":false,"showCommander":true}'
      );
    });
  });
});
