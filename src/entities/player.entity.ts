import { Team } from "./teams.entity";

const PLAYER_REGEX_PATTERN =
  /ID: (\d+) \| Online IDs: EOS: (.+) steam: (\d+) \| Name: (.+) \| Team ID: ([12]) \| Squad ID: (\d+|N\/A) \| Is Leader: (True|False) \| Role: (\w+)/;

export class Player {
  id: number;
  steamId: string;
  eosId: string;
  name: string;
  team: Team;
  squadId: number | undefined;
  leader: boolean;

  constructor(rconPlayerString: string) {
    const match = rconPlayerString.match(PLAYER_REGEX_PATTERN);

    if (!match || match.length !== 9) {
      throw new Error(`RCON player string: '${rconPlayerString}' is invalid`);
    }

    this.id = Number.parseInt(match[1], 10);
    this.eosId = match[2];
    this.steamId = match[3];
    this.name = match[4].trim();
    this.team = this.parseTeam(match[5]);
    this.squadId = this.parseSquadId(match[6]);
    this.leader = this.parseIsLeader(match[7]);
  }

  public static isValidPlayerString(rconPlayerString: string): boolean {
    return PLAYER_REGEX_PATTERN.test(rconPlayerString);
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
