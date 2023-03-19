import ServerQuery from "@fabricio-191/valve-server-query";
import { injectable } from "tsyringe";
import { ServerInfo } from "../model/server-info.model.js";
import { SquadServer } from "../model/squad-server.model.js";
import { FactionParser } from "./faction-parser.service.js";
import { Logger } from "./logger.service.js";

@injectable()
export class ServerQueryService {
  constructor(private logger: Logger) {}

  public async getServerInfo(squadServer: SquadServer): Promise<ServerInfo> {
    const server = await ServerQuery.Server({
      ip: squadServer.ip,
      port: squadServer.queryPort,
      timeout: 3000,
    });
    this.logger.debug("Connected to Server-Query-Endpoint: [%s]", squadServer.toQueryPortString());

    const info = await server.getInfo();
    if (!info) {
      throw new Error(`Could not get info from server: [${squadServer.toQueryPortString()}]`);
    }

    const rules = await server.getRules();
    if (!rules) {
      throw new Error(`Could not get rules from server: [${squadServer.toQueryPortString()}]`);
    }

    const playerCount = this.getRuleNumber(rules, "PlayerCount_i");
    const publicQueue = this.getRuleNumber(rules, "PublicQueue_i");
    const whitelistQueue = this.getRuleNumber(rules, "ReservedQueue_i");
    const playtimeSeconds = this.getRuleNumber(rules, "PLAYTIME_i");
    const teamOne = FactionParser.parseFaction(this.getRuleString(rules, "TeamOne_s"));
    const teamTwo = FactionParser.parseFaction(this.getRuleString(rules, "TeamTwo_s"));

    const serverInfo = new ServerInfo({
      serverName: info.name,
      layer: info.map,
      playerCount: playerCount,
      maxPlayerCount: info.players.max,
      teamOne: teamOne,
      teamTwo: teamTwo,
      publicQueue: publicQueue,
      whitelistQueue: whitelistQueue,
      playtimeSeconds: playtimeSeconds,
    });

    server.disconnect();
    this.logger.debug(
      "Disconnected from Server-Query-Endpoint: [%s]",
      squadServer.toQueryPortString()
    );
    return serverInfo;
  }

  private getRuleNumber(rules: ServerQuery.Server.Rules, key: string): number {
    const value = rules[key];

    if (typeof value !== "number") {
      this.logger.error(
        "Could not get value for rule with key: [%s] because value: [%s] is not a number",
        key,
        value
      );
      return 0;
    }

    return value;
  }

  private getRuleString(rules: ServerQuery.Server.Rules, key: string): string {
    const value = rules[key];

    if (typeof value !== "string") {
      this.logger.error(
        "Could not get value for rule with key: [%s] because value: [%s] is not a string",
        key,
        value
      );
      return "";
    }

    return value;
  }
}
