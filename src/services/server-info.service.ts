import ServerQuery from "@fabricio-191/valve-server-query";
import { DateTime } from "luxon";
import { singleton } from "tsyringe";
import { SquadServer } from "../entities/squad-server.entity.js";
import { Logger } from "../logger/logger.js";

const CACHE_TIMEOUT_SECONDS = 10;

const FACTIONS = [
  "ADF",
  "BAF",
  "CAF",
  "IMF",
  "INS",
  "MEA",
  "PLANMC",
  "PLA",
  "RGF",
  "USA",
  "USMC",
  "VDV",
];

interface CachedServerInfo {
  serverInfo: ServerInfoNew;
  storedAt: DateTime;
}

export interface ServerInfoNew {
  status: ServerStatus;
  ip: string;
  queryPort: string;
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

@singleton()
export class ServerInfoService {
  private logger = new Logger(ServerInfoService.name);

  private serverNameCache: Map<string, string> = new Map<string, string>();
  private serverInfoCache: Map<string, CachedServerInfo> = new Map<string, CachedServerInfo>();

  public async getServerInfo(server: SquadServer): Promise<ServerInfoNew> {
    const cachedServerInfo = this.loadCachedServerInfo(server);
    if (cachedServerInfo) {
      return cachedServerInfo;
    }

    let serverQuery: ServerQuery.Server;
    try {
      serverQuery = await ServerQuery.Server({
        ip: server.ip,
        port: server.queryPort,
        timeout: 3000,
      });
    } catch (error: unknown) {
      this.logger.warn(
        "Connection attempt to Server-Query-Endpoint: [%s] timed out",
        server.toQueryPortString()
      );
      return {
        status: ServerStatus.Offline,
        ip: server.ip,
        queryPort: server.queryPort.toString(),
        serverName: this.serverNameCache.get(server.toQueryPortString()),
      };
    }

    this.logger.debug("Connected to Server-Query-Endpoint: [%s]", server.toQueryPortString());

    const info = await serverQuery.getInfo();
    const rules = await serverQuery.getRules();

    serverQuery.disconnect();
    this.logger.debug("Disconnected from Server-Query-Endpoint: [%s]", server.toQueryPortString());

    const playerCount = this.getRuleNumber(rules, "PlayerCount_i");
    const publicQueue = this.getRuleNumber(rules, "PublicQueue_i");
    const whitelistQueue = this.getRuleNumber(rules, "ReservedQueue_i");
    const playtimeSeconds = this.getRuleNumber(rules, "PLAYTIME_i");
    const teamOne = this.parseFaction(this.getRuleString(rules, "TeamOne_s"));
    const teamTwo = this.parseFaction(this.getRuleString(rules, "TeamTwo_s"));
    const nextLayer = this.getRuleString(rules, "NextLayer_s")?.replaceAll(" ", "_");

    this.serverNameCache.set(server.toQueryPortString(), info.name);

    const serverInfo: ServerInfoNew = {
      status: ServerStatus.Online,
      ip: server.ip,
      queryPort: server.queryPort.toString(),
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

    this.serverInfoCache.set(server.toQueryPortString(), {
      serverInfo: serverInfo,
      storedAt: DateTime.now(),
    });
    return serverInfo;
  }

  private loadCachedServerInfo(server: SquadServer): ServerInfoNew | undefined {
    const cachedServerInfo = this.serverInfoCache.get(server.toQueryPortString());
    if (!cachedServerInfo) return undefined;

    if (DateTime.now().minus({ seconds: CACHE_TIMEOUT_SECONDS }) > cachedServerInfo.storedAt) {
      this.serverInfoCache.delete(server.toQueryPortString());
      return undefined;
    }

    return cachedServerInfo.serverInfo;
  }

  private getRuleNumber(rules: ServerQuery.Server.Rules, key: string): number | undefined {
    const value = rules[key];

    if (typeof value !== "number") {
      this.logger.error("Rule with key: [%s] and value: [%s] is not a number", key, value);
      return undefined;
    }

    return value;
  }

  private getRuleString(rules: ServerQuery.Server.Rules, key: string): string | undefined {
    const value = rules[key];

    if (typeof value !== "string") {
      this.logger.error("Rule with key: [%s] and value: [%s] is not a string", key, value);
      return undefined;
    }

    return value;
  }

  private parseFaction(teamString?: string): string | undefined {
    console.log(teamString);
    if (!teamString) return undefined;

    for (const faction of FACTIONS) {
      if (teamString.includes(faction)) {
        return faction;
      }
    }

    this.logger.warn("Could not parse faction from team: [%s]", teamString);
    return "Unknown";
  }
}
