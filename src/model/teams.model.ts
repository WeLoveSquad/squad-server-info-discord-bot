import { Player } from "./player.model";
import { Squad } from "./squad.model";

export class Teams {
  public readonly teamOneSquads: Map<number, Squad> = new Map();
  public readonly teamOneUnassigned: Player[] = [];
  public readonly teamOnePlayerCount: number = 0;

  public readonly teamTwoSquads: Map<number, Squad> = new Map();
  public readonly teamTwoUnassigned: Player[] = [];
  public readonly teamTwoPlayerCount: number = 0;

  constructor(squads: Squad[], players: Player[]) {
    for (const squad of squads) {
      if (squad.teamId == 1) {
        this.teamOneSquads.set(squad.id, squad);
      } else {
        this.teamTwoSquads.set(squad.id, squad);
      }
    }

    for (const player of players) {
      if (!player.squadId) {
        if (player.teamId == 1) {
          this.teamOnePlayerCount++;
          this.teamOneUnassigned.push(player);
        } else {
          this.teamTwoPlayerCount++;
          this.teamTwoUnassigned.push(player);
        }
        continue;
      }

      let squad;
      if (player.teamId == 1) {
        this.teamOnePlayerCount++;
        squad = this.teamOneSquads.get(player.squadId);
      } else {
        this.teamTwoPlayerCount++;
        squad = this.teamTwoSquads.get(player.squadId);
      }

      if (squad) {
        squad.addPlayer(player);
      }
    }
  }

  public addSquad(squad: Squad) {
    if (squad.teamId == 1) {
      this.teamOneSquads.set(squad.id, squad);
    } else {
      this.teamTwoSquads.set(squad.id, squad);
    }
  }
}
