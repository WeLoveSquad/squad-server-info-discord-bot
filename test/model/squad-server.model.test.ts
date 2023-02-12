import { expect } from "chai";
import "reflect-metadata";
import { SquadServer } from "../../src/model/squad-server.model.js";

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

  describe("toRconPortString", () => {
    it("returns correct string", () => {
      const serverString = "12.13.14.15:12345:54321:password";

      const server = new SquadServer(serverString);

      expect(server.toRconPortString()).to.equal("12.13.14.15:54321");
    });
  });

  describe("getTeams", () => {
    it("returns undefined when rcon not used", () => {
      const serverString = "12.13.14.15:12345";

      const server = new SquadServer(serverString);

      expect(server.getTeams()).to.be.undefined;
    });
  });

  describe("getNextLayer", () => {
    it("returns undefined when rcon not used", () => {
      const serverString = "12.13.14.15:12345";

      const server = new SquadServer(serverString);

      expect(server.getNextLayer()).to.be.undefined;
    });
  });

  describe("isRconConnected", () => {
    it("returns galse when rcon not used", () => {
      const serverString = "12.13.14.15:12345";

      const server = new SquadServer(serverString);

      expect(server.isRconConnected()).to.be.false;
    });
  });
});
