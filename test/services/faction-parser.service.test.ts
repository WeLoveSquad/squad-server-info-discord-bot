import { expect } from "chai";
import "reflect-metadata";
import { FactionParser } from "../../src/services/faction-parser.service.js";

describe("FactionParser", () => {
  describe("parseFaction", () => {
    it("AUS at the beginning", () => {
      const faction = FactionParser.parseFaction("AUS_LightInfantry_5RAR");

      expect(faction).to.equal("AUS");
    });
    it("AUS at the end", () => {
      const faction = FactionParser.parseFaction("Albasrah_AAS_v3_AUS");

      expect(faction).to.equal("AUS");
    });

    it("CAF at the beginning", () => {
      const faction = FactionParser.parseFaction("CAF_Mechanized_Van_Doos");

      expect(faction).to.equal("CAF");
    });
    it("CAF at the end", () => {
      const faction = FactionParser.parseFaction("AlBasrah_Invasion_v4_CAF");

      expect(faction).to.equal("CAF");
    });

    it("GB at the beginning", () => {
      const faction = FactionParser.parseFaction("GB_Fallujah_RAAS_v2");

      expect(faction).to.equal("GB");
    });
    it("GB at the end", () => {
      const faction = FactionParser.parseFaction("Narva_AAS_v2_GB");

      expect(faction).to.equal("GB");
    });

    it("INS at the beginning", () => {
      const faction = FactionParser.parseFaction("INS_Chora_Insurgency_v1");

      expect(faction).to.equal("INS");
    });
    it("INS at the end", () => {
      const faction = FactionParser.parseFaction("Albasrah_AAS_v3_INS");

      expect(faction).to.equal("INS");
    });

    it("MEA at the beginning", () => {
      const faction = FactionParser.parseFaction("MEA_Mechanized_3rdKingQadesh");

      expect(faction).to.equal("MEA");
    });
    it("MEA at the end", () => {
      const faction = FactionParser.parseFaction("Tallil_RAAS_v1_MEA");

      expect(faction).to.equal("MEA");
    });

    it("MIL at the beginning", () => {
      const faction = FactionParser.parseFaction("MIL_Belaya_AAS_v1");

      expect(faction).to.equal("MIL");
    });
    it("MIL at the end", () => {
      const faction = FactionParser.parseFaction("Belaya_RAAS_v2_MIL");

      expect(faction).to.equal("MIL");
    });

    it("USA at the beginning", () => {
      const faction = FactionParser.parseFaction("USA_Belaya_RAAS_v1");

      expect(faction).to.equal("USA");
    });
    it("USA at the end", () => {
      const faction = FactionParser.parseFaction("Narva_AAS_v1_USA");

      expect(faction).to.equal("USA");
    });

    it("USMC at the beginning", () => {
      const faction = FactionParser.parseFaction("USMC_Belaya_RAAS_v2");

      expect(faction).to.equal("USMC");
    });
    it("USMC at the end", () => {
      const faction = FactionParser.parseFaction("Belaya_RAAS_v2_USMC");

      expect(faction).to.equal("USMC");
    });

    it("RUS at the beginning", () => {
      const faction = FactionParser.parseFaction("RUS_Skorpo_AAS_v1");

      expect(faction).to.equal("RUS");
    });
    it("RUS at the end", () => {
      const faction = FactionParser.parseFaction("Anvil_AAS_v1_RUS");

      expect(faction).to.equal("RUS");
    });

    it("RU at the beginning", () => {
      const faction = FactionParser.parseFaction("RU_Narva_Destruction_v1");

      expect(faction).to.equal("RUS");
    });
    it("RU at the end", () => {
      const faction = FactionParser.parseFaction("Narva_Destruction_v1_RU");

      expect(faction).to.equal("RUS");
    });

    it("Logar_Seed_v1", () => {
      const faction = FactionParser.parseFaction("Logar_Seed_v1");

      expect(faction).to.equal("RUS");
    });

    it("Tallil_RAAS_v8", () => {
      const faction = FactionParser.parseFaction("Tallil_RAAS_v8");

      expect(faction).to.equal("GB");
    });

    it("Unknown", () => {
      const faction = FactionParser.parseFaction("Map_Gamemode_v1");

      expect(faction).to.equal("Unknown");
    });
  });
});
