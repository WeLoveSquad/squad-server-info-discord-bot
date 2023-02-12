import { Team } from "../enums/team.enum.js";
import { Player } from "./player.model";
import { Squad } from "./squad.model";

export class Teams {
  private teamOneSquads: Squad[] = [];
  private teamOneUnassigned: Player[] = [];
  private teamOnePlayerCount: number = 0;

  private teamTwoSquads: Squad[] = [];
  private teamTwoUnassigned: Player[] = [];
  private teamTwoPlayerCount: number = 0;

  constructor(squads: Squad[], players: Player[]) {
    for (const squad of squads) {
      squad.clearPlayers();

      if (squad.team === Team.ONE) {
        this.teamOneSquads.push(squad);
      } else {
        this.teamTwoSquads.push(squad);
      }
    }

    for (const player of players) {
      if (player.team == Team.ONE) {
        this.teamOnePlayerCount++;
      } else {
        this.teamTwoPlayerCount++;
      }

      if (!player.squadId) {
        this.insertUnassigned(player);
      } else {
        this.insertPlayerToSquad(player);
      }
    }

    this.teamOneSquads.sort((a, b) => a.id - b.id);
    this.teamTwoSquads.sort((a, b) => a.id - b.id);
  }

  public getSquads(team: Team): Squad[] {
    if (team == Team.ONE) {
      return this.teamOneSquads;
    } else {
      return this.teamTwoSquads;
    }
  }

  public getUnassigned(team: Team): Player[] {
    if (team == Team.ONE) {
      return this.teamOneUnassigned;
    } else {
      return this.teamTwoUnassigned;
    }
  }

  public getPlayerCount(team: Team): number {
    if (team == Team.ONE) {
      return this.teamOnePlayerCount;
    } else {
      return this.teamTwoPlayerCount;
    }
  }

  private insertPlayerToSquad(player: Player): void {
    const squads = player.team == Team.ONE ? this.teamOneSquads : this.teamTwoSquads;

    for (const squad of squads) {
      if (squad.id === player.squadId) {
        squad.addPlayer(player);
        break;
      }
    }
  }

  private insertUnassigned(player: Player): void {
    if (player.team == Team.ONE) {
      this.teamOneUnassigned.push(player);
    } else {
      this.teamTwoUnassigned.push(player);
    }
  }
}
