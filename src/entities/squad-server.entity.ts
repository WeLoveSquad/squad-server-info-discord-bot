const IP_REGEX_PATTERN = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

export class SquadServer {
  public readonly ip: string;
  public readonly rconPort: number;
  public readonly rconPassword: string;

  public name?: string;

  constructor(serverString: string) {
    const serverParams = serverString.split(":");

    if (serverParams.length !== 3) {
      throw new Error(
        `'${serverString}' is not valid. The string has to follow the format: <IP>:<RCON-Port>:<RCON-Password>`
      );
    }

    this.ip = this.validateIp(serverParams[0]);
    this.rconPort = this.parsePort(serverParams[1]);
    this.rconPassword = serverParams[2];
  }

  private validateIp(ip: string): string {
    if (!IP_REGEX_PATTERN.test(ip)) {
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

  public toRconPortString(): string {
    return `${this.ip}:${this.rconPort}`;
  }

  public equals(other: SquadServer): boolean {
    return this.ip === other.ip && this.rconPort === other.rconPort;
  }
}
