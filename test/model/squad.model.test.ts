import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Player } from "../../src/entities/player.entity.js";
import { Squad } from "../../src/entities/squad.entity.js";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Squad", () => {
  describe("constructor", () => {
    it("extracts correct information", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: False | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      const squad = new Squad(rconSquad, 1);

      expect(squad.id).to.equal(15);
      expect(squad.team).to.equal(1);
      expect(squad.name).to.equal("Test Squad 123");
      expect(squad.size).to.equal(5);
      expect(squad.locked).to.equal(false);
      expect(squad.players.length).to.equal(0);
    });

    it("extracts correct boolean", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      const squad = new Squad(rconSquad, 1);

      expect(squad.id).to.equal(15);
      expect(squad.team).to.equal(1);
      expect(squad.name).to.equal("Test Squad 123");
      expect(squad.size).to.equal(5);
      expect(squad.locked).to.equal(true);
      expect(squad.players.length).to.equal(0);
    });

    it("sets correct team", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      const squad = new Squad(rconSquad, 2);

      expect(squad.id).to.equal(15);
      expect(squad.team).to.equal(2);
      expect(squad.name).to.equal("Test Squad 123");
      expect(squad.size).to.equal(5);
      expect(squad.locked).to.equal(true);
      expect(squad.players.length).to.equal(0);
    });

    it("too few attributes throws error", () => {
      const rconSquad =
        "ID: 15 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(() => {
        new Squad(rconSquad, 1);
      }).to.throw(`RCON squad string: [${rconSquad}] is invalid`);
    });

    it("invalid id format", () => {
      const rconSquad =
        "ID: string | Name: Test Squad 123 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(() => {
        new Squad(rconSquad, 1);
      }).to.throw(`RCON squad string: [${rconSquad}] is invalid`);
    });

    it("invalid size format", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: string | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(() => {
        new Squad(rconSquad, 1);
      }).to.throw(`RCON squad string: [${rconSquad}] is invalid`);
    });

    it("invalid locked format", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: string | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(() => {
        new Squad(rconSquad, 1);
      }).to.throw(`RCON squad string: [${rconSquad}] is invalid`);
    });

    it("invalid steamId format", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: string";

      expect(() => {
        new Squad(rconSquad, 1);
      }).to.throw(`RCON squad string: [${rconSquad}] is invalid`);
    });
  });

  describe("addPlayer", () => {
    it("adds players correctly", () => {
      const rconPlayer1 =
        "ID: 1 | SteamID: 76561197960287930 | Name: Player1 | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";
      const rconPlayer2 =
        "ID: 2 | SteamID: 76561197960287931 | Name: Player2 | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";
      const rconPlayer3 =
        "ID: 3 | SteamID: 76561197960287932 | Name: Player3 | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";

      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: False | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      const player = new Player(rconPlayer1);
      const player2 = new Player(rconPlayer2);
      const player3 = new Player(rconPlayer3);

      const squad = new Squad(rconSquad, 1);

      squad.addPlayer(player2);
      squad.addPlayer(player);
      squad.addPlayer(player3);

      expect(squad.players.length).to.equal(3);
      expect(squad.players[0]).to.equal(player);
      expect(squad.players[1]).to.equal(player2);
      expect(squad.players[2]).to.equal(player3);
    });
  });

  describe("clearPlayers", () => {
    it("adds players correctly", () => {
      const rconPlayer1 =
        "ID: 1 | SteamID: 76561197960287930 | Name: Player1 | Team ID: 1 | Squad ID: 5 | Is Leader: True | Role: USA_Recruit";
      const rconPlayer2 =
        "ID: 2 | SteamID: 76561197960287931 | Name: Player2 | Team ID: 1 | Squad ID: 5 | Is Leader: False | Role: USA_Recruit";

      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: False | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      const player = new Player(rconPlayer1);
      const player2 = new Player(rconPlayer2);

      const squad = new Squad(rconSquad, 1);

      squad.addPlayer(player2);
      squad.addPlayer(player);

      expect(squad.players.length).to.equal(2);

      squad.clearPlayers();
      expect(squad.players.length).to.equal(0);
    });
  });

  describe("isValidSquadString", () => {
    it("extracts correct information", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: False | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(Squad.isValidSquadString(rconSquad)).to.be.true;
    });

    it("too few attributes throws error", () => {
      const rconSquad =
        "ID: 15 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(Squad.isValidSquadString(rconSquad)).to.be.false;
    });

    it("invalid id format", () => {
      const rconSquad =
        "ID: string | Name: Test Squad 123 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(Squad.isValidSquadString(rconSquad)).to.be.false;
    });

    it("invalid size format", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: string | Locked: True | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(Squad.isValidSquadString(rconSquad)).to.be.false;
    });

    it("invalid locked format", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: string | Creator Name: TestName | Creator Steam ID: 76561197960287930";

      expect(Squad.isValidSquadString(rconSquad)).to.be.false;
    });

    it("invalid steamId format", () => {
      const rconSquad =
        "ID: 15 | Name: Test Squad 123 | Size: 5 | Locked: True | Creator Name: TestName | Creator Steam ID: string";

      expect(Squad.isValidSquadString(rconSquad)).to.be.false;
    });
  });
});
