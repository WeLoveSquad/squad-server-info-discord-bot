import { RconConnection } from "./rcon-connection.model.js";
import { Teams } from "./teams.model.js";

const IP_REGEX = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

export class SquadServer {
  public readonly ip: string;
  public readonly queryPort: number;
  public name?: string;

  public readonly rconEnabled: boolean = false;
  public readonly rconPort?: number;
  public readonly rconPassword?: string;

  private readonly rconConnection?: RconConnection;

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
      this.rconConnection = new RconConnection(this.ip, this.rconPort, this.rconPassword);
    }
  }

  public getTeams(): Teams | undefined {
    if (!this.rconConnection?.isConnected()) {
      return undefined;
    }

    return this.rconConnection.getTeams();
  }

  public getNextLayer(): string | undefined {
    if (!this.rconConnection?.isConnected()) {
      return undefined;
    }

    return this.rconConnection.getNextLayer();
  }

  public isRconConnected(): boolean {
    if (!this.rconConnection) {
      return false;
    }

    return this.rconConnection.isConnected();
  }

  public hasReceivedPlayerData(): boolean {
    if (!this.rconConnection) {
      return false;
    }

    return this.rconConnection.hasReceivedPlayerData();
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
}
