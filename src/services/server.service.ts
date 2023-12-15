import config from "config";
import { singleton } from "tsyringe";
import { SquadServer } from "../entities/squad-server.entity.js";

@singleton()
export class ServerService {
  private squadServers: SquadServer[] = [];

  constructor() {
    const serverConfig = config.get<string>("squad.servers");
    const servers = serverConfig.split(",");

    for (const server of servers) {
      const squadServer = new SquadServer(server);
      if (this.contains(squadServer)) {
        throw new Error(
          `The config contains the server '${squadServer.toRconPortString()}' twice. A server can only be added once.`
        );
      }

      this.squadServers.push(squadServer);
    }
  }

  public getServers(): SquadServer[] {
    return this.squadServers;
  }

  public getServerCount(): number {
    return this.squadServers.length;
  }

  private contains(server: SquadServer): boolean {
    for (const squadServer of this.squadServers) {
      if (squadServer.equals(server)) {
        return true;
      }
    }

    return false;
  }
}
