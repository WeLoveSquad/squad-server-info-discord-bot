import { Player } from "../../src/entities/player.entity.js";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Player", () => {
  describe("constructor", () => {
    it("extracts correct information", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      const player = new Player(rconPlayer);

      expect(player.id).to.equal(23);
      expect(player.steamdid).to.equal("76561197960287930");
      expect(player.name).to.equal("TestName");
      expect(player.teamId).to.equal(1);
      expect(player.squadId).to.equal(5);
      expect(player.leader).to.equal(true);
    });

    it("extracts correct boolean", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";

      const player = new Player(rconPlayer);

      expect(player.leader).to.equal(false);
    });

    it("unassigned player", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: N/A | Is Leader: False | Role: USA_Recruit";

      const player = new Player(rconPlayer);

      expect(player.id).to.equal(23);
      expect(player.steamdid).to.equal("76561197960287930");
      expect(player.name).to.equal("TestName");
      expect(player.teamId).to.equal(1);
      expect(player.squadId).to.be.undefined;
      expect(player.leader).to.equal(false);
    });

    it("too few attributes throws error", () => {
      const rconPlayer =
        "SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";

      expect(() => {
        new Player(rconPlayer);
      }).to.throw(`RCON player string: '${rconPlayer}' is invalid`);
    });

    it("too many attributes throws error", () => {
      const rconPlayer =
        " ID: 23 | SteamID: 76561197960287930 | NewValue: Test | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";

      expect(() => {
        new Player(rconPlayer);
      }).to.throw(`RCON player string: '${rconPlayer}' is invalid`);
    });

    it("invalid id type throws error", () => {
      const rconPlayer =
        "ID: string | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      expect(() => {
        new Player(rconPlayer);
      }).to.throw(`RCON player string: '${rconPlayer}' is invalid`);
    });

    it("invalid steamId type throws error", () => {
      const rconPlayer =
        "ID: 23 | SteamID: string | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      expect(() => {
        new Player(rconPlayer);
      }).to.throw(`RCON player string: '${rconPlayer}' is invalid`);
    });

    it("invalid teamId type throws error", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: string | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      expect(() => {
        new Player(rconPlayer);
      }).to.throw(`RCON player string: '${rconPlayer}' is invalid`);
    });

    it("invalid squadId type throws error", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: string | Is Leader: True | Role: USA_Recruit";

      expect(() => {
        new Player(rconPlayer);
      }).to.throw(`RCON player string: '${rconPlayer}' is invalid`);
    });
  });

  describe("isValidPlayerString", () => {
    it("correct string returns true", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      expect(Player.isValidPlayerString(rconPlayer)).to.be.true;
    });

    it("too few attributes returns false", () => {
      const rconPlayer =
        "SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";

      expect(Player.isValidPlayerString(rconPlayer)).to.be.false;
    });

    it("too many attributes throws error", () => {
      const rconPlayer =
        " ID: 23 | SteamID: 76561197960287930 | NewValue: Test | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";

      expect(Player.isValidPlayerString(rconPlayer)).to.be.false;
    });

    it("invalid id type throws error", () => {
      const rconPlayer =
        "ID: string | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      expect(Player.isValidPlayerString(rconPlayer)).to.be.false;
    });

    it("invalid steamId type throws error", () => {
      const rconPlayer =
        "ID: 23 | SteamID: string | Name: TestName | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      expect(Player.isValidPlayerString(rconPlayer)).to.be.false;
    });

    it("invalid teamId type throws error", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: string | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";

      expect(Player.isValidPlayerString(rconPlayer)).to.be.false;
    });

    it("invalid squadId type throws error", () => {
      const rconPlayer =
        "ID: 23 | SteamID: 76561197960287930 | Name: TestName | Team ID: 1 | Squad ID: string | Is Leader: True | Role: USA_Recruit";

      expect(Player.isValidPlayerString(rconPlayer)).to.be.false;
    });
  });
});
