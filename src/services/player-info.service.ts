import { singleton } from "tsyringe";
import { SquadServer } from "../entities/squad-server.entity.js";
import { Teams } from "../entities/teams.entity.js";
import { Logger } from "../logger/logger.js";
import { Rcon } from "../rcon/rcon.js";

const LIST_SQUADS_REQUEST = "ListSquads";
const LIST_PLAYERS_REQUEST = "ListPlayers";

@singleton()
export class PlayerInfoService {
  private logger = new Logger(PlayerInfoService.name);

  private rconConnections: Map<string, Rcon> = new Map<string, Rcon>();

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

  private async getRconConnection(server: SquadServer): Promise<Rcon> {
    if (!server.rconEnabled || !server.rconPort || !server.rconPassword) {
      throw new Error("TODO");
    }

    const connection = this.rconConnections.get(server.toQueryPortString());
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

    this.rconConnections.set(server.toQueryPortString(), rcon);
    return rcon;
  }
}
