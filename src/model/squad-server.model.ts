import { RconService } from "../services/rcon.service.js";
import { Teams } from "./teams.model.js";

export interface ServerOptions {
  ip: string;
  queryPort: number;
  rconPort?: number;
  rconPassword?: string;
  showPlayers?: boolean;
}

const IP_REGEX = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

export class SquadServer {
  public readonly ip: string;
  public readonly queryPort: number;
  public showPlayers: boolean;
  public readonly rconPort?: number;
  public readonly rconPassword?: string;
  private readonly rconService?: RconService;

  constructor(options: ServerOptions) {
    if (!IP_REGEX.test(options.ip)) {
      throw new Error(`IP: [${options.ip}] ist not a valid IP-Address`);
    }
    if (!this.isValidPort(options.queryPort)) {
      throw new Error(`Query-Port: [${options.queryPort}] ist not a valid Port`);
    }
    if (options.rconPort && !this.isValidPort(options.rconPort)) {
      throw new Error(`Rcon-Port: [${options.rconPort}] ist not a valid Port`);
    }
    if (options.rconPort && !options.rconPassword) {
      throw new Error(`Cannot set Rcon-Port without providing a Rcon-Password`);
    }

    this.ip = options.ip;
    this.queryPort = options.queryPort;
    this.rconPort = options.rconPort;
    this.rconPassword = options.rconPassword ?? undefined;
    this.showPlayers = options.showPlayers ?? false;

    if (this.rconPort && this.rconPassword) {
      this.rconService = new RconService(this.ip, this.rconPort, this.rconPassword);
    }
  }

  public getTeams(): Teams | undefined {
    return this.rconService?.getTeams();
  }

  public getNextLayer(): string | undefined {
    return this.rconService?.getNextLayer();
  }

  public setShowPlayers(show: boolean): void {
    this.showPlayers = show;
  }

  public dispose(): void {
    this.rconService?.disconect();
  }

  public equals(other: SquadServer): boolean {
    return this.ip == other.ip && this.queryPort == other.queryPort;
  }

  public toString(): string {
    if (this.rconPort) {
      return `IP: ${this.ip}, Query-Port: ${this.queryPort}, Rcon-Port: ${this.rconPort}`;
    } else {
      return `IP: ${this.ip}, Query-Port: ${this.queryPort}, Rcon disabled`;
    }
  }

  public toQueryPortString(): string {
    return `${this.ip}:${this.queryPort}`;
  }

  public toRconPortString(): string {
    return `${this.ip}:${this.rconPort}`;
  }

  private isValidPort(port: number) {
    return port >= 1 || port <= 65535;
  }
}
