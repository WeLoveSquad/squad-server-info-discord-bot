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

    it("parses ADF correctly", () => {
      const faction = server["parseFaction"]("AlBasrah_AAS_v3_ADF");
      expect(faction).to.equal("ADF");
    });

    it("parses BAF correctly", () => {
      const faction = server["parseFaction"]("Belaya_Invasion_v3_BAF");
      expect(faction).to.equal("BAF");
    });

    it("parses CAF correctly", () => {
      const faction = server["parseFaction"]("Yehorivka_Invasion_v3_CAF");
      expect(faction).to.equal("CAF");
    });

    it("parses IMF correctly", () => {
      const faction = server["parseFaction"]("Tallil_Skirmish_v3_IMF");
      expect(faction).to.equal("IMF");
    });

    it("parses INS correctly", () => {
      const faction = server["parseFaction"]("Sumari_Insurgency_v1_INS");
      expect(faction).to.equal("INS");
    });

    it("parses MEA correctly", () => {
      const faction = server["parseFaction"]("Anvil_RAAS_v2_MEA");
      expect(faction).to.equal("MEA");
    });

    it("parses PLA correctly", () => {
      const faction = server["parseFaction"]("Chora_AAS_v6_PLA");
      expect(faction).to.equal("PLA");
    });

    it("parses RGF correctly", () => {
      const faction = server["parseFaction"]("BlackCoast_Invasion_v1_RGF");
      expect(faction).to.equal("RGF");
    });

    it("parses RGF correctly", () => {
      const faction = server["parseFaction"]("BlackCoast_Invasion_v1_RGF");
      expect(faction).to.equal("RGF");
    });

    it("parses USA correctly", () => {
      const faction = server["parseFaction"]("FoolsRoad_AAS_v1_USA");
      expect(faction).to.equal("USA");
    });

    it("parses USMC correctly", () => {
      const faction = server["parseFaction"]("Harju_RAAS_v1_USMC");
      expect(faction).to.equal("USMC");
    });

    it("returns unknown if parsing fails", () => {
      const faction = server["parseFaction"]("Map_Gamemode_v1");
      expect(faction).to.equal("Unknown");
    });
  });
});
