import ServerQuery from "@fabricio-191/valve-server-query";
import { Logger } from "../logger/logger.js";
import { RconConnection } from "./rcon-connection.entity.js";
import { Teams } from "./teams.entity.js";

const IP_REGEX = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

const FACTIONS = [
  "ADF",
  "BAF",
  "CAF",
  "IMF",
  "INS",
  "MEA",
  "PLA",
  "PLANMC",
  "RGF",
  "USA",
  "USMC",
  "VDV",
];

const SERVER_QUERY_ERROR_MESSAGE = "Server Query Endpoint is not responding";
const RCON_ERROR_MESSAGE = "Error: Could not establish RCON connection";
const RCON_LOADING_PLAYERS_MESSAGE = "Loading player data...";

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
  private readonly logger;

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
    this.logger = new Logger(`${SquadServer.name}, ${this.ip}:${this.queryPort}`);

    if (serverParams.length === 4) {
      this.rconPort = this.parsePort(serverParams[2]);
      this.rconPassword = serverParams[3];
      this.rconEnabled = true;
      this.rconConnection = new RconConnection(this.ip, this.rconPort, this.rconPassword);
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

  public async getServerInfo(): Promise<ServerInfo> {
    let server: ServerQuery.Server;
    try {
      server = await ServerQuery.Server({
        ip: this.ip,
        port: this.queryPort,
        timeout: 3000,
      });
    } catch (error: unknown) {
      this.logger.warn("Connection attempt to Server-Query-Endpoint timed out");
      throw new ServerInfoError(SERVER_QUERY_ERROR_MESSAGE);
    }

    this.logger.debug("Connected to Server-Query-Endpoint");

    const info = await server.getInfo();
    const rules = await server.getRules();

    server.disconnect();
    this.logger.debug("Disconnected from Server-Query-Endpoint");

    const playerCount = this.getRuleNumber(rules, "PlayerCount_i");
    const publicQueue = this.getRuleNumber(rules, "PublicQueue_i");
    const whitelistQueue = this.getRuleNumber(rules, "ReservedQueue_i");
    const playtimeSeconds = this.getRuleNumber(rules, "PLAYTIME_i");
    const teamOne = this.parseFaction(this.getRuleString(rules, "TeamOne_s"));
    const teamTwo = this.parseFaction(this.getRuleString(rules, "TeamTwo_s"));
    const nextLayer = this.getRuleString(rules, "NextLayer_s").replaceAll(" ", "_");

    this.name = info.name;

    const serverInfo: ServerInfo = {
      serverName: info.name,
      layer: info.map,
      nextLayer: nextLayer,
      maxPlayerCount: info.players.max,
      playerCount,
      teamOne,
      teamTwo,
      publicQueue,
      whitelistQueue,
      playtimeSeconds,
    };

    if (!this.rconEnabled) {
      return serverInfo;
    } else if (!this.rconConnection?.isConnected()) {
      serverInfo.rconMessage = RCON_ERROR_MESSAGE;
      return serverInfo;
    }

    if (this.rconConnection.hasReceivedPlayerData()) {
      serverInfo.teams = this.rconConnection.getTeams();
    } else {
      serverInfo.rconMessage = RCON_LOADING_PLAYERS_MESSAGE;
    }

    return serverInfo;
  }

  private getRuleNumber(rules: ServerQuery.Server.Rules, key: string): number {
    const value = rules[key];

    if (typeof value !== "number") {
      this.logger.error("Rule with key: [%s] and value: [%s] is not a number", key, value);
      throw new ServerInfoError(SERVER_QUERY_ERROR_MESSAGE);
    }

    return value;
  }

  private getRuleString(rules: ServerQuery.Server.Rules, key: string): string {
    const value = rules[key];

    if (typeof value !== "string") {
      this.logger.error("Rule with key: [%s] and value: [%s] is not a string", key, value);
      throw new ServerInfoError(SERVER_QUERY_ERROR_MESSAGE);
    }

    return value;
  }

  private parseFaction(teamString: string): string {
    for (const faction of FACTIONS) {
      if (teamString.includes(faction)) {
        return faction;
      }
    }

    this.logger.warn("Could not parse faction from team: [%s]", teamString);
    return "Unknown";
  }

  public toQueryPortString(): string {
    return `${this.ip}:${this.queryPort}`;
  }

  public equals(other: SquadServer): boolean {
    return this.ip === other.ip && this.queryPort === other.queryPort;
  }
}
