import { Teams } from "./teams.entity.js";

const IP_REGEX = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

export interface ServerInfo {
  serverName: string;
  layer: string;
  playerCount: number;
  maxPlayerCount: number;
  teamOne: string;
  teamTwo: string;
  publicQueue: number;
  whitelistQueue: number;
  playtimeSeconds: number;
  nextLayer?: string;
  teams?: Teams;
  rconMessage?: string;
}

export class ServerInfoError extends Error {}

export class SquadServer {
  public readonly ip: string;
  public readonly queryPort: number;
  public name?: string;

  public readonly rconEnabled: boolean = false;
  public readonly rconPort?: number;
  public readonly rconPassword?: string;

  constructor(serverString: string) {
    const serverParams = serverString.split(":");

    if (serverParams.length !== 2 && serverParams.length !== 4) {
      throw new Error(
        `'${serverString}' is not valid. The string has to follow the format: <IP>:<Query-Port> or <IP>:<Query-Port>:<RCON-Port>:<RCON-Password>`
      );
    }

    this.ip = this.validateIp(serverParams[0]);
    this.queryPort = this.parsePort(serverParams[1]);

    if (serverParams.length === 4) {
      this.rconPort = this.parsePort(serverParams[2]);
      this.rconPassword = serverParams[3];
      this.rconEnabled = true;
    }
  }

  private validateIp(ip: string): string {
    if (!IP_REGEX.test(ip)) {
      throw new Error(`IP: '${ip}' is not a valid IP-Address`);
    }

    return ip;
  }

  private parsePort(portStr: string): number {
    const port = Number.parseInt(portStr, 10);

    if (isNaN(port) || port < 0 || port > 65535) {
      throw new Error(`Port: '${portStr}' is not a valid Port`);
    }

    return port;
  }

  public toQueryPortString(): string {
    return `${this.ip}:${this.queryPort}`;
  }

  public toRconPortString(): string {
    return `${this.ip}:${this.rconPort}`;
  }

  public equals(other: SquadServer): boolean {
    return this.ip === other.ip && this.queryPort === other.queryPort;
  }
}
