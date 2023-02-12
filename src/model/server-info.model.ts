import { Teams } from "./teams.model";

interface ServerInfoOptions {
  serverName: string;
  layer: string;
  playerCount: number;
  maxPlayerCount: number;
  teamOne: string;
  teamTwo: string;
  publicQueue: number;
  whitelistQueue: number;
  playtimeSeconds: number;
}

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

  public nextLayer?: string;
  public teams?: Teams;
  public rconMessage?: string;

  constructor(options: ServerInfoOptions) {
    this.serverName = options.serverName;
    this.layer = options.layer;
    this.playerCount = options.playerCount;
    this.maxPlayerCount = options.maxPlayerCount;
    this.teamOne = options.teamOne;
    this.teamTwo = options.teamTwo;
    this.publicQueue = options.publicQueue;
    this.whitelistQueue = options.whitelistQueue;
    this.playtimeSeconds = options.playtimeSeconds;
  }
}
