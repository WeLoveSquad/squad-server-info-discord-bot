import { expect } from "chai";
import "reflect-metadata";
import { SquadServer } from "../../src/entities/squad-server.entity.js";

describe("SquadServer", () => {
  describe("constructor", () => {
    it("parses server correctly", () => {
      const serverString = "12.13.14.15:54321:password";

      const server = new SquadServer(serverString);

      expect(server.ip).to.equal("12.13.14.15");
      expect(server.rconPort).to.equal(54321);
      expect(server.rconPassword).to.equal("password");
    });
  });

  it("rcon without password throws error", () => {
    const serverString = "12.13.14.15:54321";

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
    const serverString = "12.13.15:54321:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`IP: '12.13.15' is not a valid IP-Address`);
  });

  it("invalid rcon port string throws error", () => {
    const serverString = "12.13.14.15:text:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: 'text' is not a valid Port`);
  });

  it("too small rcon port throws error", () => {
    const serverString = "12.13.14.15:-1:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: '-1' is not a valid Port`);
  });

  it("too big rcon port throws error", () => {
    const serverString = "12.13.14.15:65536:password";

    expect(() => {
      new SquadServer(serverString);
    }).to.throw(`Port: '65536' is not a valid Port`);
  });

  describe("toRconPortString", () => {
    it("returns correct rcon port string", () => {
      const serverString = "12.13.14.15:54321:password";

      const server = new SquadServer(serverString);

      expect(server.toRconPortString()).to.equal("12.13.14.15:54321");
    });
  });
});
