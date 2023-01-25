export class Player {
  id: number;
  steamdid: string;
  name: string;
  teamId: number;
  squadId: number | undefined;
  leader: boolean;

  constructor(rconPlayerString: string) {
    const attributes = rconPlayerString.split(" | ");

    if (attributes.length != 7) {
      throw new Error(`rcon player info: [${rconPlayerString}] is invalid`);
    }

    this.id = this.parseId(attributes[0]);
    this.steamdid = this.parseSteamId(attributes[1]);
    this.name = this.parseName(attributes[2]);
    this.teamId = this.parseTeamid(attributes[3]);
    this.squadId = this.parseSquadId(attributes[4]);
    this.leader = this.parseIsLeader(attributes[5]);
  }

  private parseId(idString: string): number {
    const id: string = idString.split("ID: ")[1];

    return Number(id);
  }

  private parseSteamId(steamIdString: string): string {
    return steamIdString.split("SteamID: ")[1];
  }

  private parseName(nameString: string): string {
    return nameString.split("Name: ")[1];
  }

  private parseTeamid(teamIdString: string): number {
    const teamId: string = teamIdString.split("Team ID: ")[1];

    return Number(teamId);
  }

  private parseSquadId(squadIdString: string): number | undefined {
    const squadId: string = squadIdString.split("Squad ID: ")[1];

    if (squadId == "N/A") {
      return undefined;
    }

    return Number(squadId);
  }

  private parseIsLeader(isLeaderString: string): boolean {
    const isLeader: string = isLeaderString.split("Is Leader: ")[1];

    return isLeader.toLowerCase() === "true";
  }
}
