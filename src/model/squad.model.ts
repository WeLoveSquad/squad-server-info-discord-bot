import { Team } from "../enums/team.enum.js";
import { Player } from "./player.model";

const SQUAD_REGEX =
  /ID: (\d+) \| Name: (.*) \| Size: (\d+) \| Locked: (True|False) \| Creator Name: (.*) \| Creator Steam ID: (\d+)/;

export class Squad {
  id: number;
  team: Team;
  name: string;
  size: number;
  locked: boolean;
  players: Player[] = [];

  constructor(rconSquadString: string, team: Team) {
    const match = rconSquadString.match(SQUAD_REGEX);

    if (!match || match.length != 7) {
      throw new Error(`RCON squad string: [${rconSquadString}] is invalid`);
    }

    this.team = team;
    this.id = Number.parseInt(match[1]);
    this.name = match[2];
    this.size = Number.parseInt(match[3]);
    this.locked = this.parseLocked(match[4]);
  }

  public static isValidSquadString(rconSquadString: string): boolean {
    return SQUAD_REGEX.test(rconSquadString);
  }

  public addPlayer(player: Player): void {
    if (player.leader) {
      this.players.splice(0, 0, player);
    } else {
      this.players.push(player);
    }
  }

  public clearPlayers(): void {
    this.players = [];
  }

  private parseLocked(isLocked: string): boolean {
    return isLocked.toLowerCase() === "true";
  }
}
