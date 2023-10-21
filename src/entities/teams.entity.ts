import { Player } from "./player.entity.js";
import { Squad } from "./squad.entity.js";

export type Team = 1 | 2;

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
    let team: Team = 1;

    for (const line of splitResponse) {
      if (line.startsWith("Team ID: 2")) {
        team = 2;
        continue;
      }

      if (Squad.isValidSquadString(line)) {
        const squad = new Squad(line, team);
        if (team === 1) {
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
        if (player.team === 1) {
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
    const squads = player.team === 1 ? this.teamOneSquads : this.teamTwoSquads;

    for (const squad of squads) {
      if (squad.id === player.squadId) {
        squad.addPlayer(player);
        break;
      }
    }
  }

  private insertUnassigned(player: Player): void {
    if (player.team === 1) {
      this.teamOneUnassigned.push(player);
    } else {
      this.teamTwoUnassigned.push(player);
    }
  }

  public getSquads(team: Team): Squad[] {
    if (team === 1) {
      return this.teamOneSquads;
    } else {
      return this.teamTwoSquads;
    }
  }

  public getUnassigned(team: Team): Player[] {
    if (team === 1) {
      return this.teamOneUnassigned;
    } else {
      return this.teamTwoUnassigned;
    }
  }

  public getPlayerCount(team: Team): number {
    if (team === 1) {
      return this.teamOnePlayerCount;
    } else {
      return this.teamTwoPlayerCount;
    }
  }
}
