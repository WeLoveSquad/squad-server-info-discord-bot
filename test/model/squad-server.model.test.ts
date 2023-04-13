import { expect } from "chai";
import "reflect-metadata";
import { SquadServer } from "../../src/entities/squad-server.entity.js";

describe("SquadServer", () => {
  describe("constructor", () => {
    it("parses with rcon correctly", () => {
      const serverString = "12.13.14.15:12345:54321:password";

      const server = new SquadServer(serverString);

      expect(server.ip).to.equal("12.13.14.15");
      expect(server.queryPort).to.equal(12345);
      expect(server.rconPort).to.equal(54321);
      expect(server.rconPassword).to.equal("password");
      expect(server.rconEnabled).to.be.true;
    });
  });

  it("parses without rcon correctly", () => {
    const serverString = "12.13.14.15:12345";

    const server = new SquadServer(serverString);

    expect(server.ip).to.equal("12.13.14.15");
    expect(server.queryPort).to.equal(12345);
    expect(server.rconPort).to.be.undefined;
    expect(server.rconPassword).to.be.undefined;
    expect(server.rconEnabled).to.be.false;
  });

  it("rcon without password throws error", () => {
    const serverString = "12.13.14.15:12345:54321";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`'${serverString}' is not valid.`);
  });

  it("only ip throws error", () => {
    const serverString = "12.13.14.15";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`'${serverString}' is not valid.`);
  });

  it("invalid string throws error", () => {
    const serverString = "some weird string";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`'${serverString}' is not valid.`);
  });

  it("invalid ip throws error", () => {
    const serverString = "12.13.15:12345:54321:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`IP: '12.13.15' is not a valid IP-Address`);
  });

  it("invalid query port string throws error", () => {
    const serverString = "12.13.14.15:text:54321:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: 'text' is not a valid Port`);
  });

  it("too small query port throws error", () => {
    const serverString = "12.13.14.15:-1:54321:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: '-1' is not a valid Port`);
  });

  it("too big query port throws error", () => {
    const serverString = "12.13.14.15:65536:54321:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: '65536' is not a valid Port`);
  });

  it("invalid rcon port string throws error", () => {
    const serverString = "12.13.14.15:12345:text:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: 'text' is not a valid Port`);
  });

  it("too small rcon port throws error", () => {
    const serverString = "12.13.14.15:12345:-1:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: '-1' is not a valid Port`);
  });

  it("too big rcon port throws error", () => {
    const serverString = "12.13.14.15:12345:65536:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: '65536' is not a valid Port`);
  });

  describe("toQueryPortString", () => {
    it("returns correct string", () => {
      const serverString = "12.13.14.15:12345:54321:password";

      const server = new SquadServer(serverString);

      expect(server.toQueryPortString()).to.equal("12.13.14.15:12345");
    });
  });

  describe("parseFaction", () => {
    const serverString = "12.13.14.15:12345:54321:password";
    const server = new SquadServer(serverString);

    it("AUS at the beginning", () => {
      const faction = server["parseFaction"]("AUS_LightInfantry_5RAR");
      expect(faction).to.equal("AUS");
    });
    it("AUS at the end", () => {
      const faction = server["parseFaction"]("Albasrah_AAS_v3_AUS");
      expect(faction).to.equal("AUS");
    });
    it("CAF at the beginning", () => {
      const faction = server["parseFaction"]("CAF_Mechanized_Van_Doos");
      expect(faction).to.equal("CAF");
    });
    it("CAF at the end", () => {
      const faction = server["parseFaction"]("AlBasrah_Invasion_v4_CAF");
      expect(faction).to.equal("CAF");
    });
    it("GB at the beginning", () => {
      const faction = server["parseFaction"]("GB_Fallujah_RAAS_v2");
      expect(faction).to.equal("GB");
    });
    it("GB at the end", () => {
      const faction = server["parseFaction"]("Narva_AAS_v2_GB");
      expect(faction).to.equal("GB");
    });
    it("INS at the beginning", () => {
      const faction = server["parseFaction"]("INS_Chora_Insurgency_v1");
      expect(faction).to.equal("INS");
    });
    it("INS at the end", () => {
      const faction = server["parseFaction"]("Albasrah_AAS_v3_INS");
      expect(faction).to.equal("INS");
    });
    it("MEA at the beginning", () => {
      const faction = server["parseFaction"]("MEA_Mechanized_3rdKingQadesh");
      expect(faction).to.equal("MEA");
    });
    it("MEA at the end", () => {
      const faction = server["parseFaction"]("Tallil_RAAS_v1_MEA");
      expect(faction).to.equal("MEA");
    });
    it("MIL at the beginning", () => {
      const faction = server["parseFaction"]("MIL_Belaya_AAS_v1");
      expect(faction).to.equal("MIL");
    });
    it("MIL at the end", () => {
      const faction = server["parseFaction"]("Belaya_RAAS_v2_MIL");
      expect(faction).to.equal("MIL");
    });
    it("USA at the beginning", () => {
      const faction = server["parseFaction"]("USA_Belaya_RAAS_v1");
      expect(faction).to.equal("USA");
    });
    it("USA at the end", () => {
      const faction = server["parseFaction"]("Narva_AAS_v1_USA");
      expect(faction).to.equal("USA");
    });
    it("USMC at the beginning", () => {
      const faction = server["parseFaction"]("USMC_Belaya_RAAS_v2");
      expect(faction).to.equal("USMC");
    });
    it("USMC at the end", () => {
      const faction = server["parseFaction"]("Belaya_RAAS_v2_USMC");
      expect(faction).to.equal("USMC");
    });
    it("RUS at the beginning", () => {
      const faction = server["parseFaction"]("RUS_Skorpo_AAS_v1");
      expect(faction).to.equal("RUS");
    });
    it("RUS at the end", () => {
      const faction = server["parseFaction"]("Anvil_AAS_v1_RUS");
      expect(faction).to.equal("RUS");
    });
    it("RU at the beginning", () => {
      const faction = server["parseFaction"]("RU_Narva_Destruction_v1");
      expect(faction).to.equal("RUS");
    });
    it("RU at the end", () => {
      const faction = server["parseFaction"]("Narva_Destruction_v1_RU");
      expect(faction).to.equal("RUS");
    });
    it("Logar_Seed_v1", () => {
      const faction = server["parseFaction"]("Logar_Seed_v1");
      expect(faction).to.equal("RUS");
    });
    it("Tallil_RAAS_v8", () => {
      const faction = server["parseFaction"]("Tallil_RAAS_v8");
      expect(faction).to.equal("GB");
    });
    it("Unknown", () => {
      const faction = server["parseFaction"]("Map_Gamemode_v1");
      expect(faction).to.equal("Unknown");
    });
  });
});
