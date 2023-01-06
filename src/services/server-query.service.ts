import ServerQuery from "@fabricio-191/valve-server-query";
import { injectable } from "tsyringe";
import { ServerAddress } from "../model/server-address.model.js";
import { ServerInfo } from "../model/server-info.model.js";
import { Logger } from "./logger.service.js";

@injectable()
export class ServerQueryService {
  private factions = ["AUS", "CAF", "GB", "INS", "MEA", "MIL", "RUS", "USA", "USMC", "PLA"];

  constructor(private logger: Logger) {}

  public async getServerInfo(serverAddress: ServerAddress): Promise<ServerInfo> {
    const server = await ServerQuery.Server({
      ip: serverAddress.ip,
      port: serverAddress.port,
      timeout: 3000,
    });
    this.logger.debug("Connected to server: [%s]", serverAddress.toString());

    const info = await server.getInfo();
    if (!info) {
      throw new Error(`Could not get info from server: [${serverAddress}]`);
    }

    const rules = await server.getRules();
    if (!rules) {
      throw new Error(`Could not get rules from server: [${serverAddress}]`);
    }

    const playerCount = this.getRuleNumber(rules, "PlayerCount_i");
    const publicQueue = this.getRuleNumber(rules, "PublicQueue_i");
    const whitelistQueue = this.getRuleNumber(rules, "ReservedQueue_i");
    const playtimeSeconds = this.getRuleNumber(rules, "PLAYTIME_i");
    const teamOne = this.parseFaction(this.getRuleString(rules, "TeamOne_s"));
    const teamTwo = this.parseFaction(this.getRuleString(rules, "TeamTwo_s"));

    const serverInfo = new ServerInfo(
      info.name,
      info.map,
      playerCount,
      info.players.max,
      teamOne,
      teamTwo,
      publicQueue,
      whitelistQueue,
      playtimeSeconds
    );

    server.disconnect();
    this.logger.debug("Disconnected from server [%s]", serverAddress.toString());
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
      return -1;
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

  parseFaction(team: string): string {
    for (const faction of this.factions) {
      if (team.includes(faction)) {
        return faction;
      }
    }

    if (team.includes("RU") || team == "Logar_Seed_v1") {
      return "RUS";
    } else if (team == "Tallil_RAAS_v8") {
      return "GB";
    }

    this.logger.warn("Could not parse faction from team: [%s]", team);
    return "Unknown";
  }
}
