export class ServerAddress {
  private static ADDRESS_REGEX = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/;

  public readonly ip: string;
  public readonly port: number;

  constructor(address: string) {
    const match = address.match(ServerAddress.ADDRESS_REGEX);

    if (!match || match.length != 3) {
      throw new Error(`Could not extract ip and port from ${address}`);
    }

    this.ip = match[1];
    this.port = Number.parseInt(match[2]);
  }

  equals(other: ServerAddress): boolean {
    return this.ip == other.ip && this.port == other.port;
  }

  toString(): string {
    return `${this.ip}:${this.port}`;
  }
}
