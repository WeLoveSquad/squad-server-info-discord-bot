import config from "config";
import { singleton } from "tsyringe";
import { ServerInfo } from "../model/server-info.model.js";
import { SquadServer } from "../model/squad-server.model.js";
import { ServerQueryService } from "./server-query.service.js";

export class ServerQueryError extends Error {}

@singleton()
export class ServerService {
  private squadServers: SquadServer[] = [];

  constructor(private serverQueryService: ServerQueryService) {
    const serversStr = config.get<string>("squad.servers");

    const servers = serversStr.split(",");

    for (const server of servers) {
      this.squadServers.push(new SquadServer(server));
    }
  }

  public getServers(): SquadServer[] {
    return [...this.squadServers];
  }

  public async getServerInfo(server: SquadServer): Promise<ServerInfo> {
    let serverInfo;
    try {
      serverInfo = await this.serverQueryService.getServerInfo(server);
    } catch (error: any) {
      throw new ServerQueryError("Server Query Endpoint is not responding");
    }

    if (!server.rconEnabled) {
      return serverInfo;
    }

    if (server.isRconConnected() && server.hasReceivedPlayerData()) {
      serverInfo.nextLayer = server.getNextLayer();
      serverInfo.teams = server.getTeams();
    } else if (server.isRconConnected() && !server.hasReceivedPlayerData()) {
      serverInfo.rconMessage = "Loading player data...";
    } else if (!server.isRconConnected()) {
      serverInfo.rconMessage = "Error: Could not establish RCON connection";
    }

    return serverInfo;
  }
}
