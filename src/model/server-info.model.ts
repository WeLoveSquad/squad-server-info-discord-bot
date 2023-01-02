export class ServerInfo {
  public readonly serverName: string;
  public readonly layer: string;
  public readonly playerCount: number;
  public readonly maxPlayerCount: number;
  public readonly teamOne: string;
  public readonly teamTwo: string;
  public readonly publicQueue: number;
  public readonly whitelistQueue: number;
  public readonly playtimeSeconds: number;

  constructor(
    serverName: string,
    layer: string,
    playerCount: number,
    maxPlayerCount: number,
    teamOne: string,
    teamTwo: string,
    publicQueue: number,
    whitelistQueue: number,
    playtimeSeconds: number
  ) {
    this.serverName = serverName;
    this.layer = layer;
    this.playerCount = playerCount;
    this.maxPlayerCount = maxPlayerCount;
    this.teamOne = teamOne;
    this.teamTwo = teamTwo;
    this.publicQueue = publicQueue;
    this.whitelistQueue = whitelistQueue;
    this.playtimeSeconds = playtimeSeconds;
  }
}
