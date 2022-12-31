export class ServerInfo {
  public serverName: string;
  public layer: string;
  public playerCount: number;
  public maxPlayerCount: number;
  public teamOne: string;
  public teamTwo: string;
  public publicQueue: number;
  public whitelistQueue: number;
  public playtimeSeconds: number;

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
