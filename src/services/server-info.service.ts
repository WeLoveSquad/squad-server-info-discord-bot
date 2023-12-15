import { singleton } from "tsyringe";
import { SquadServer } from "../entities/squad-server.entity.js";
import { Teams } from "../entities/teams.entity.js";
import { Logger } from "../logger/logger.js";
import { Rcon } from "../rcon/rcon.js";

const LIST_SQUADS_REQUEST = "ListSquads";
const LIST_PLAYERS_REQUEST = "ListPlayers";
const SERVER_INFO_REQUEST = "ShowServerInfo";

export interface ServerInfo {
  status: ServerStatus;
  ip: string;
  rconPort: number;
  serverName?: string;
  layer?: string;
  playerCount?: number;
  maxPlayerCount?: number;
  teamOne?: string;
  teamTwo?: string;
  publicQueue?: number;
  whitelistQueue?: number;
  playtimeSeconds?: number;
  nextLayer?: string;
}

export enum ServerStatus {
  Online,
  Offline,
}

const FACTION_REGEX_PATTERN = /^.+_([A-Z]{3,})$/;

@singleton()
export class ServerInfoService {
  private logger = new Logger(ServerInfoService.name);

  private serverNameCache: Map<string, string> = new Map<string, string>();
  private rconConnections: Map<string, Rcon> = new Map<string, Rcon>();

  public async getServerInfo(server: SquadServer): Promise<ServerInfo> {
    try {
      const rcon = await this.getRconConnection(server);

      const serverInfoResponse = await rcon.execute(SERVER_INFO_REQUEST);
      const json = JSON.parse(serverInfoResponse);

      const serverName = json["ServerName_s"];
      this.serverNameCache.set(server.toRconPortString(), serverName);

      return {
        status: ServerStatus.Online,
        ip: server.ip,
        rconPort: server.rconPort,
        serverName: serverName,
        layer: json["MapName_s"],
        nextLayer: json["NextLayer_s"].replaceAll(" ", "_"),
        maxPlayerCount: parseInt(json["MaxPlayers"]),
        playerCount: parseInt(json["PlayerCount_I"]),
        teamOne: this.parseFaction(json["TeamOne_s"]),
        teamTwo: this.parseFaction(json["TeamTwo_s"]),
        publicQueue: parseInt(json["PublicQueue_I"]),
        whitelistQueue: parseInt(json["ReservedQueue_I"]),
        playtimeSeconds: parseInt(json["PLAYTIME_I"]),
      };
    } catch (error: unknown) {
      this.logger.warn(
        "Could not load server information from server: [%s]",
        server.toRconPortString()
      );
      return {
        status: ServerStatus.Offline,
        ip: server.ip,
        rconPort: server.rconPort,
        serverName: this.serverNameCache.get(server.toRconPortString()),
      };
    }
  }

  public async getTeams(server: SquadServer): Promise<Teams | undefined> {
    try {
      const rcon = await this.getRconConnection(server);

      const squadsResponse = await rcon.execute(LIST_SQUADS_REQUEST);
      const playerResponse = await rcon.execute(LIST_PLAYERS_REQUEST);

      return new Teams(squadsResponse, playerResponse);
    } catch (error: unknown) {
      this.logger.warn(
        "Could not load player information from server: [%s]",
        server.toRconPortString()
      );
      return undefined;
    }
  }

  private parseFaction(teamString?: string): string | undefined {
    if (!teamString) return undefined;

    const match = teamString.match(FACTION_REGEX_PATTERN);
    if (!match || match.length != 2) {
      this.logger.warn("Could not parse faction from team: [%s]", teamString);
      return "Unknown";
    }

    return match[1];
  }

  private async getRconConnection(server: SquadServer): Promise<Rcon> {
    const connection = this.rconConnections.get(server.toRconPortString());
    if (connection) {
      return connection;
    }

    const rcon = new Rcon({
      host: server.ip,
      port: server.rconPort,
      password: server.rconPassword,
      autoConnect: false,
      autoReconnect: true,
    });
    await rcon.connect();

    this.rconConnections.set(server.toRconPortString(), rcon);
    return rcon;
  }
}
