import { Team } from "./teams.entity";

const PLAYER_REGEX =
  /ID: (\d+) \| SteamID: (\d+) \| Name: (.+) \| Team ID: ([12]) \| Squad ID: (\d+|N\/A) \| Is Leader: (True|False) \| Role: (\w+)/;

export class Player {
  id: number;
  steamId: string;
  name: string;
  team: Team;
  squadId: number | undefined;
  leader: boolean;

  constructor(rconPlayerString: string) {
    const match = rconPlayerString.match(PLAYER_REGEX);

    if (!match || match.length !== 8) {
      throw new Error(`RCON player string: '${rconPlayerString}' is invalid`);
    }

    this.id = Number.parseInt(match[1], 10);
    this.steamId = match[2];
    this.name = match[3].trim();
    this.team = this.parseTeam(match[4]);
    this.squadId = this.parseSquadId(match[5]);
    this.leader = this.parseIsLeader(match[6]);
  }

  public static isValidPlayerString(rconPlayerString: string): boolean {
    return PLAYER_REGEX.test(rconPlayerString);
  }

  private parseTeam(teamId: string): Team {
    const team = Number.parseInt(teamId, 10);
    if (team != 1 && team != 2) {
      throw new Error(`TeamId: '${teamId}' is invalid`);
    }
    return team;
  }

  private parseIsLeader(isLeader: string): boolean {
    return isLeader.toLowerCase() === "true";
  }

  private parseSquadId(squadId: string): number | undefined {
    if (squadId === "N/A") {
      return undefined;
    }

    return Number.parseInt(squadId, 10);
  }
}
