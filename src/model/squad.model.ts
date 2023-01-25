import { Player } from "./player.model";

export class Squad {
  id: number;
  teamId: number;
  name: string;
  size: number;
  locked: boolean;
  players: Player[] = [];

  constructor(rconSquadString: string, teamId: number) {
    const attributes = rconSquadString.split(" | ");

    if (attributes.length != 6) {
      throw new Error(`rcon squad info: [${rconSquadString}] is invalid`);
    }

    this.teamId = teamId;
    this.id = this.parseId(attributes[0]);
    this.name = this.parseName(attributes[1]);
    this.size = this.parseSize(attributes[2]);
    this.locked = this.parseLocked(attributes[3]);
  }

  public addPlayer(player: Player): void {
    this.players.push(player);
  }

  private parseId(idString: string): number {
    const id: string = idString.split("ID: ")[1];

    return Number(id);
  }

  private parseName(nameString: string): string {
    return nameString.split("Name: ")[1];
  }

  private parseSize(sizeString: string): number {
    const size: string = sizeString.split("Size: ")[1];

    return Number(size);
  }

  private parseLocked(lockedString: string): boolean {
    const locked: string = lockedString.split("Locked: ")[1];

    return locked.toLowerCase() === "true";
  }
}
