import { expect } from "chai";
import "reflect-metadata";
import { container } from "tsyringe";
import { ServerQueryService } from "../src/services/server-query.service.js";

describe("parseFaction", () => {
  const serverQueryService = container.resolve(ServerQueryService);
  it("AUS at the beginning", () => {
    const faction = serverQueryService.parseFaction("AUS_LightInfantry_5RAR");

    expect(faction).to.equal("AU");
  });
  it("AUS at the end", () => {
    const faction = serverQueryService.parseFaction("Albasrah_AAS_v3_AUS");

    expect(faction).to.equal("AUS");
  });

  it("CAF at the beginning", () => {
    const faction = serverQueryService.parseFaction("CAF_Mechanized_Van_Doos");

    expect(faction).to.equal("CAF");
  });
  it("CAF at the end", () => {
    const faction = serverQueryService.parseFaction("AlBasrah_Invasion_v4_CAF");

    expect(faction).to.equal("CAF");
  });

  it("GB at the beginning", () => {
    const faction = serverQueryService.parseFaction("GB_Fallujah_RAAS_v2");

    expect(faction).to.equal("GB");
  });
  it("GB at the end", () => {
    const faction = serverQueryService.parseFaction("Narva_AAS_v2_GB");

    expect(faction).to.equal("GB");
  });

  it("INS at the beginning", () => {
    const faction = serverQueryService.parseFaction("INS_Chora_Insurgency_v1");

    expect(faction).to.equal("INS");
  });
  it("INS at the end", () => {
    const faction = serverQueryService.parseFaction("Albasrah_AAS_v3_INS");

    expect(faction).to.equal("INS");
  });

  it("MEA at the beginning", () => {
    const faction = serverQueryService.parseFaction("MEA_Mechanized_3rdKingQadesh");

    expect(faction).to.equal("MEA");
  });
  it("MEA at the end", () => {
    const faction = serverQueryService.parseFaction("Tallil_RAAS_v1_MEA");

    expect(faction).to.equal("MEA");
  });

  it("MIL at the beginning", () => {
    const faction = serverQueryService.parseFaction("MIL_Belaya_AAS_v1");

    expect(faction).to.equal("MIL");
  });
  it("MIL at the end", () => {
    const faction = serverQueryService.parseFaction("Belaya_RAAS_v2_MIL");

    expect(faction).to.equal("MIL");
  });

  it("USA at the beginning", () => {
    const faction = serverQueryService.parseFaction("USA_Belaya_RAAS_v1");

    expect(faction).to.equal("USA");
  });
  it("USA at the end", () => {
    const faction = serverQueryService.parseFaction("Narva_AAS_v1_USA");

    expect(faction).to.equal("USA");
  });

  it("USMC at the beginning", () => {
    const faction = serverQueryService.parseFaction("USMC_Belaya_RAAS_v2");

    expect(faction).to.equal("USMC");
  });
  it("USMC at the end", () => {
    const faction = serverQueryService.parseFaction("Belaya_RAAS_v2_USMC");

    expect(faction).to.equal("USMC");
  });

  it("RUS at the beginning", () => {
    const faction = serverQueryService.parseFaction("RUS_Skorpo_AAS_v1");

    expect(faction).to.equal("RUS");
  });
  it("RUS at the end", () => {
    const faction = serverQueryService.parseFaction("Anvil_AAS_v1_RUS");

    expect(faction).to.equal("RUS");
  });

  it("RU at the beginning", () => {
    const faction = serverQueryService.parseFaction("RU_Narva_Destruction_v1");

    expect(faction).to.equal("RUS");
  });
  it("RU at the end", () => {
    const faction = serverQueryService.parseFaction("Narva_Destruction_v1_RU");

    expect(faction).to.equal("RUS");
  });

  it("Unknown", () => {
    const faction = serverQueryService.parseFaction("Tallil_RAAS_v8");

    expect(faction).to.equal("Unknown");
  });
});
