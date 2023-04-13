import { Team } from "../enums/team.enum.js";
import { Player } from "./player.entity.js";
import { Squad } from "./squad.entity.js";

export class Teams {
  private teamOneSquads: Squad[] = [];
  private teamOneUnassigned: Player[] = [];
  private teamOnePlayerCount = 0;

  private teamTwoSquads: Squad[] = [];
  private teamTwoUnassigned: Player[] = [];
  private teamTwoPlayerCount = 0;

  constructor(squadsResponse?: string, playerResponse?: string) {
    if (!squadsResponse || !playerResponse) {
      return;
    }

    this.parseSquads(squadsResponse);
    this.parsePlayers(playerResponse);

    this.teamOneSquads = this.teamOneSquads.filter((squad) => squad.players.length >= 1);
    this.teamTwoSquads = this.teamTwoSquads.filter((squad) => squad.players.length >= 1);

    this.teamOneSquads.sort((a, b) => a.id - b.id);
    this.teamTwoSquads.sort((a, b) => a.id - b.id);
  }

  private parseSquads(squadsResponse: string): void {
    const splitResponse = squadsResponse.split("\n");

    let team = Team.ONE;

    for (const line of splitResponse) {
      if (line.startsWith("Team ID: 2")) {
        team = Team.TWO;
        continue;
      }

      if (Squad.isValidSquadString(line)) {
        const squad = new Squad(line, team);
        if (team === Team.ONE) {
          this.teamOneSquads.push(squad);
        } else {
          this.teamTwoSquads.push(squad);
        }
      }
    }
  }

  private parsePlayers(playerResponse: string): void {
    const splitResponse = playerResponse.split("\n");

    for (const line of splitResponse) {
      if (Player.isValidPlayerString(line)) {
        const player = new Player(line);
        if (player.team === Team.ONE) {
          this.teamOnePlayerCount += 1;
        } else {
          this.teamTwoPlayerCount += 1;
        }

        if (!player.squadId) {
          this.insertUnassigned(player);
        } else {
          this.insertPlayerToSquad(player);
        }
      }
    }
  }

  private insertPlayerToSquad(player: Player): void {
    const squads = player.team === Team.ONE ? this.teamOneSquads : this.teamTwoSquads;

    for (const squad of squads) {
      if (squad.id === player.squadId) {
        squad.addPlayer(player);
        break;
      }
    }
  }

  private insertUnassigned(player: Player): void {
    if (player.team === Team.ONE) {
      this.teamOneUnassigned.push(player);
    } else {
      this.teamTwoUnassigned.push(player);
    }
  }

  public getSquads(team: Team): Squad[] {
    if (team === Team.ONE) {
      return this.teamOneSquads;
    } else {
      return this.teamTwoSquads;
    }
  }

  public getUnassigned(team: Team): Player[] {
    if (team === Team.ONE) {
      return this.teamOneUnassigned;
    } else {
      return this.teamTwoUnassigned;
    }
  }

  public getPlayerCount(team: Team): number {
    if (team === Team.ONE) {
      return this.teamOnePlayerCount;
    } else {
      return this.teamTwoPlayerCount;
    }
  }
}
