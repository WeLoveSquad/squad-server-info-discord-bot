import { Team } from "../enums/team.enum.js";

const PLAYER_REGEX =
  /ID: (\d+) \| SteamID: (\d+) \| Name: (.+) \| Team ID: ([12]) \| Squad ID: (\d+|N\/A) \| Is Leader: (True|False) \| Role: (\w+)/;

export class Player {
  id: number;
  steamdid: string;
  name: string;
  teamId: number;
  team: Team;
  squadId: number | undefined;
  leader: boolean;

  constructor(rconPlayerString: string) {
    const match = rconPlayerString.match(PLAYER_REGEX);

    if (!match || match.length != 8) {
      throw new Error(`RCON player string: '${rconPlayerString}' is invalid`);
    }

    this.id = Number.parseInt(match[1]);
    this.steamdid = match[2];
    this.name = match[3].trim();
    this.teamId = Number.parseInt(match[4]);
    this.team = Team.fromNumber(this.teamId);
    this.squadId = this.parseSquadId(match[5]);
    this.leader = this.parseIsLeader(match[6]);
  }

  public static isValidPlayerString(rconPlayerString: string) {
    return PLAYER_REGEX.test(rconPlayerString);
  }

  private parseIsLeader(isLeader: string): boolean {
    return isLeader.toLowerCase() === "true";
  }

  private parseSquadId(squadId: string): number | undefined {
    if (squadId === "N/A") {
      return undefined;
    }

    return Number.parseInt(squadId);
  }
}
