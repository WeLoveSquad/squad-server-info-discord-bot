import { expect } from "chai";
import { Teams } from "../../src/entities/teams.entity.js";

describe("Teams", () => {
  const squadsResponse = `
----- Active Squads -----
Team ID: 1 (1st Battalion, 1st Marines)
ID: 2 | Name: Team1Squad2 | Size: 3 | Locked: False | Creator Name: Team1Squad1Player1 | Creator Online IDs: EOS: 00024b689cd348dab06858cf004a9a85 steam: 76561198318626647
ID: 1 | Name: Team1Squad1 | Size: 2 | Locked: True | Creator Name: Team1Squad2Player1 | Creator Online IDs: EOS: 00024b689cd348dab06858cf004a9a85 steam: 76561198271648708
Team ID: 2 (205th Separate Motor Rifle Brigade)
ID: 1 | Name: Team2Squad1 | Size: 3 | Locked: False | Creator Name: Team2Squad1Player1 | Creator Online IDs: EOS: 00024b689cd348dab06858cf004a9a85 steam: 76561199260788348
ID: 2 | Name: Team2Squad2 | Size: 1 | Locked: True | Creator Name: Team2Squad2Player1 | Creator Online IDs: EOS: 00024b689cd348dab06858cf004a9a85 steam: 76561198017344604
`;

  const playersResponse = `
----- Active Players -----
ID: 1 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561198287492345 | Name: Team1Squad1Player1 | Team ID: 1 | Squad ID: 1 | Is Leader: True | Role: USMC_Marksman_01
ID: 2 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561197966340835 | Name: Team1Squad2Player1 | Team ID: 1 | Squad ID: 2 | Is Leader: True | Role: USMC_Rifleman_01
ID: 3 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561198287492345 | Name: Team2Squad1Player1 | Team ID: 2 | Squad ID: 1 | Is Leader: True | Role: RUS_Marksman_01
ID: 4 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561197966340835 | Name: Team2Squad2Player1 | Team ID: 2 | Squad ID: 2 | Is Leader: True | Role: RUS_Rifleman_01

ID: 5 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561198006594412 | Name: Team1Squad1Player2 | Team ID: 1 | Squad ID: 1 | Is Leader: False | Role: USMC_Medic_02
ID: 6 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561198108974422 | Name: Team1Squad2Player2 | Team ID: 1 | Squad ID: 2 | Is Leader: False | Role: USMC_Grenadier_01
ID: 7 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561199386953097 | Name: Team1Squad2Player3 | Team ID: 1 | Squad ID: 2 | Is Leader: False | Role: USMC_Marksman_01
ID: 8 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561198879719852 | Name: Team2Squad1Player2 | Team ID: 2 | Squad ID: 1 | Is Leader: False | Role: RUS_Recruit
ID: 9 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561198011242851 | Name: Team2Squad1Player3 | Team ID: 2 | Squad ID: 1 | Is Leader: False | Role: RUS_Rifleman_03
ID: 10 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561143232242851 | Name: Team1UnassignedPlayer1 | Team ID: 1 | Squad ID: N/A | Is Leader: False | Role: RUS_Rifleman_03
----- Recently Disconnected Players [Max of 15] -----
ID: 92 | Online IDs: EOS: 000212345678912bbbcc5a40edc3798d steam: 76561199142404779 | Since Disconnect: 04m.25s | Name: DisconnectedPlayer
`;

  describe("constructor", () => {
    it("parses with undefined correctly", () => {
      const teams = new Teams(undefined, undefined);

      expect(teams.getPlayerCount(1)).to.equal(0);
      expect(teams.getPlayerCount(2)).to.equal(0);
      expect(teams.getSquads(1).length).to.equal(0);
      expect(teams.getSquads(2).length).to.equal(0);
      expect(teams.getUnassigned(1).length).to.equal(0);
      expect(teams.getUnassigned(2).length).to.equal(0);
    });

    it("parses with squads and players correctly", () => {
      const teams = new Teams(squadsResponse, playersResponse);
      const teamOneSquads = teams.getSquads(1);
      const teamTwoSquads = teams.getSquads(2);
      const teamOneUnassigned = teams.getUnassigned(1);
      const teamTwoUnassigned = teams.getUnassigned(2);

      expect(teams.getPlayerCount(1)).to.equal(6);
      expect(teams.getPlayerCount(2)).to.equal(4);

      expect(teamOneUnassigned.length).to.equal(1);
      expect(teamOneUnassigned[0].name).to.equal("Team1UnassignedPlayer1");

      expect(teamTwoUnassigned.length).to.equal(0);

      expect(teamOneSquads.length).to.equal(2);
      expect(teamTwoSquads.length).to.equal(2);

      expect(teamOneSquads[0].id).to.equal(1);
      expect(teamOneSquads[0].size).to.equal(2);
      expect(teamOneSquads[0].players.length).to.equal(2);
      expect(teamOneSquads[0].players.find((p) => p.name === "Team1Squad1Player1")).not.undefined;
      expect(teamOneSquads[0].players.find((p) => p.name === "Team1Squad1Player2")).not.undefined;
      expect(teamOneSquads[0].players.find((p) => p.name === "Team1Squad2Player1")).undefined;

      expect(teamOneSquads[1].id).to.equal(2);
      expect(teamOneSquads[1].size).to.equal(3);
      expect(teamOneSquads[1].players.length).to.equal(3);
      expect(teamOneSquads[1].players.find((p) => p.name === "Team1Squad2Player1")).not.undefined;
      expect(teamOneSquads[1].players.find((p) => p.name === "Team1Squad2Player2")).not.undefined;
      expect(teamOneSquads[1].players.find((p) => p.name === "Team1Squad2Player3")).not.undefined;

      expect(teamTwoSquads[0].id).to.equal(1);
      expect(teamTwoSquads[0].size).to.equal(3);
      expect(teamTwoSquads[0].players.length).to.equal(3);
      expect(teamTwoSquads[0].players.find((p) => p.name === "Team2Squad1Player1")).not.undefined;
      expect(teamTwoSquads[0].players.find((p) => p.name === "Team2Squad1Player2")).not.undefined;
      expect(teamTwoSquads[0].players.find((p) => p.name === "Team2Squad1Player3")).not.undefined;

      expect(teamTwoSquads[1].id).to.equal(2);
      expect(teamTwoSquads[1].size).to.equal(1);
      expect(teamTwoSquads[1].players.length).to.equal(1);
      expect(teamTwoSquads[1].players.find((p) => p.name === "Team2Squad2Player1")).not.undefined;
    });
  });
});
