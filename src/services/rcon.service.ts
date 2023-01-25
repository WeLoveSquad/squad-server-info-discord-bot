import Rcon from "rcon";
import { container } from "tsyringe";
import { Player } from "../model/player.model.js";
import { Squad } from "../model/squad.model.js";
import { Teams } from "../model/teams.model.js";
import { Logger } from "./logger.service.js";

export class RconService {
  private logger: Logger;

  private rcon: Rcon;
  private isConnected: boolean = false;
  private rconInterval?: NodeJS.Timer;

  private squads: Squad[] = [];
  private players: Player[] = [];
  private nextLayer: string = "Unknown";

  private serverAddres: string;

  constructor(ip: string, port: number, password: string) {
    this.logger = container.resolve(Logger);

    this.serverAddres = `${ip}:${port}`;
    this.rcon = new Rcon(ip, port, password, {
      tcp: true,
      challenge: true,
    });

    this.logger.info("[RCON, %s] Connected to rcon server", this.serverAddres);

    this.rcon.addListener("response", (message: string) => this.handleMessage(message.trim()));

    this.rcon.addListener("end", () => {
      this.logger.error("[RCON, %s] Rcon connection closed", this.serverAddres);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.rcon.addListener("error", (error) => {
      this.logger.error("[RCON, %s] Rcon error: [%s]", this.serverAddres, error);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.rcon.addListener("auth", () => {
      this.logger.info("[RCON, %s] Successfully connected", this.serverAddres);
      this.isConnected = true;

      this.initInterval();
    });

    this.rcon.connect();
  }

  public disconect(): void {
    clearInterval(this.rconInterval);
    this.rcon.disconnect();
  }

  public getTeams(): Teams {
    return new Teams(this.squads, this.players);
  }

  public getNextLayer(): string {
    return this.nextLayer;
  }

  private initInterval() {
    clearInterval(this.rconInterval);

    this.rconInterval = setInterval(() => {
      if (this.isConnected) {
        this.rcon.send("ListSquads");
        this.rcon.send("ListPlayers");
        this.rcon.send("ShowNextMap");
      } else {
        this.logger.debug(
          "[RCON, %s] Rcon not connected! Will not request any data",
          this.serverAddres
        );
      }
    }, 10 * 1000);
  }

  private handleMessage(message: string) {
    // TODO: Handle partial messages
    if (message.startsWith("----- Active Players -----")) {
      this.logger.verbose("Received response to ListPlayers");
      // this.handlePlayersMessage(message);
      this.handlePlayersMessage(`----- Active Players -----
ID: 0 | SteamID: 76561198082507052 | Name: Mikerosoft™ | Team ID: 1 | Squad ID: 1 | Is Leader: True | Role: USA_Recruit
ID: 1 | SteamID: 76561198082507052 | Name: Sq2Player1 | Team ID: 1 | Squad ID: 2 | Is Leader: True | Role: USA_Recruit
ID: 2 | SteamID: 76561198082507052 | Name: Sq2Player2 | Team ID: 1 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 3 | SteamID: 76561198082507052 | Name: Sq2Player3 | Team ID: 1 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 4 | SteamID: 76561198082507052 | Name: LangerNameLel | Team ID: 1 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 5 | SteamID: 76561198082507052 | Name: Sq3Player1 | Team ID: 1 | Squad ID: 3 | Is Leader: True | Role: USA_Recruit
ID: 6 | SteamID: 76561198082507052 | Name: Sq3Player2 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 7 | SteamID: 76561198082507052 | Name: Sq3Player3 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 8 | SteamID: 76561198082507052 | Name: Sq3Player4 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 9 | SteamID: 76561198082507052 | Name: Sq3Player5 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 10 | SteamID: 76561198082507052 | Name: Sq3Player6 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 11 | SteamID: 76561198082507052 | Name: Sq3Player7 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 12 | SteamID: 76561198082507052 | Name: Sq3Player8 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 13 | SteamID: 76561198082507052 | Name: Sq3Player9 | Team ID: 1 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 14 | SteamID: 76561198082507052 | Name: Sq4Player1 | Team ID: 1 | Squad ID: 4 | Is Leader: False | Role: USA_Recruit
ID: 15 | SteamID: 76561198082507052 | Name: Sq4Player1 | Team ID: 1 | Squad ID: 4 | Is Leader: False | Role: USA_Recruit
ID: 16 | SteamID: 76561198082507052 | Name: Sq1Player1 | Team ID: 2 | Squad ID: 1 | Is Leader: True | Role: USA_Recruit
ID: 17 | SteamID: 76561198082507052 | Name: Sq1Player2 | Team ID: 2 | Squad ID: 1 | Is Leader: False | Role: USA_Recruit
ID: 18 | SteamID: 76561198082507052 | Name: Sq2Player1 | Team ID: 2 | Squad ID: 2 | Is Leader: True | Role: USA_Recruit
ID: 19 | SteamID: 76561198082507052 | Name: Sq2Player2 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 20 | SteamID: 76561198082507052 | Name: Sq2Player3 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 21 | SteamID: 76561198082507052 | Name: Sq2Player4 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 22 | SteamID: 76561198082507052 | Name: Sq2Player5 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 23 | SteamID: 76561198082507052 | Name: Sq2Player6 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 24 | SteamID: 76561198082507052 | Name: Sq2Player7 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 25 | SteamID: 76561198082507052 | Name: Sq2Player8 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 26 | SteamID: 76561198082507052 | Name: Sq2Player9 | Team ID: 2 | Squad ID: 2 | Is Leader: False | Role: USA_Recruit
ID: 27 | SteamID: 76561198082507052 | Name: Sq3Player1 | Team ID: 2 | Squad ID: 3 | Is Leader: True | Role: USA_Recruit
ID: 28 | SteamID: 76561198082507052 | Name: Sq3Player2 | Team ID: 2 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 29 | SteamID: 76561198082507052 | Name: Sq3Player3 | Team ID: 2 | Squad ID: 3 | Is Leader: False | Role: USA_Recruit
ID: 30 | SteamID: 76561198082507052 | Name: Sq4Player1 | Team ID: 2 | Squad ID: 4 | Is Leader: True | Role: USA_Recruit
ID: 31 | SteamID: 76561198082507052 | Name: Sq4Player2 | Team ID: 2 | Squad ID: 4 | Is Leader: False | Role: USA_Recruit
ID: 32 | SteamID: 76561198082507052 | Name: Sq4Player1 | Team ID: 2 | Squad ID: 4 | Is Leader: False | Role: USA_Recruit
ID: 33 | SteamID: 76561198082507052 | Name: Unassigned1 | Team ID: 1 | Squad ID: N/A | Is Leader: False | Role: USA_Recruit
ID: 34 | SteamID: 76561198082507052 | Name: Unassigned2 | Team ID: 1 | Squad ID: N/A | Is Leader: False | Role: USA_Recruit
ID: 35 | SteamID: 76561198082507052 | Name: Unassigned3 | Team ID: 2 | Squad ID: N/A | Is Leader: False | Role: USA_Recruit
ID: 36 | SteamID: 76561198082507052 | Name: Unassigned4 | Team ID: 2 | Squad ID: N/A | Is Leader: False | Role: USA_Recruit
ID: 37 | SteamID: 76561198082507052 | Name: Unassigned5 | Team ID: 2 | Squad ID: N/A | Is Leader: False | Role: USA_Recruit
ID: 38 | SteamID: 76561198082507052 | Name: Unassigned5 | Team ID: 2 | Squad ID: 15 | Is Leader: True | Role: USA_Recruit
ID: 39 | SteamID: 76561198082507052 | Name: Unassigned5 | Team ID: 2 | Squad ID: 6 | Is Leader: True | Role: USA_Recruit
ID: 40 | SteamID: 76561198082507052 | Name: Unassigned5 | Team ID: 2 | Squad ID: 7 | Is Leader: True | Role: USA_Recruit
ID: 41 | SteamID: 76561198082507052 | Name: Unassigned5 | Team ID: 2 | Squad ID: 8 | Is Leader: True | Role: USA_Recruit
----- Recently Disconnected Players [Max of 15] -----
ID: 38 | SteamID: 76561198082507052 | Name: Disc1 | Team ID: 2 | Squad ID: N/A | Is Leader: False | Role: USA_Recruit`);
    } else if (message.startsWith("----- Active Squads -----")) {
      this.logger.verbose("Received response to ListSquads");
      // this.handleSquadsMessage(message);
      this.handleSquadsMessage(`----- Active Squads -----
Team ID: 1 (US Brigade Combat Team)
ID: 1 | Name: MBT | Size: 1 | Locked: True | Creator Name: Mikerosoft™ | Creator Steam ID: 76561198082507052
ID: 2 | Name: GER MIC INF | Size: 4 | Locked: False | Creator Name: Sq2Player1 | Creator Steam ID: 76561198082507052
ID: 3 | Name: INF MIC GER | Size: 9 | Locked: False | Creator Name: Sq3Player1 | Creator Steam ID: 76561198082507052
ID: 4 | Name: HELI | Size: 2 | Locked: True | Creator Name: Sq4Player1 | Creator Steam ID: 76561198082507052
Team ID: 2 (Russian Battalion Tactical Group)
ID: 1 | Name: MBT | Size: 2 | Locked: True | Creator Name: Sq1Player1 | Creator Steam ID: 76561198082507052
ID: 2 | Name: FISCH | Size: 9 | Locked: False | Creator Name: Sq2Player1 | Creator Steam ID: 76561198082507052
ID: 3 | Name: RESTE | Size: 3 | Locked: False | Creator Name: Sq3Player1 | Creator Steam ID: 76561198082507052
ID: 4 | Name: TEST SQUAD | Size: 1 | Locked: False | Creator Name: Sq4Player1 | Creator Steam ID: 76561198082507052
ID: 15 | Name: TEST SQUAD2 | Size: 1 | Locked: False | Creator Name: Sq5Player1 | Creator Steam ID: 76561198082507052
ID: 6 | Name: TEST SQUAD3 | Size: 1 | Locked: False | Creator Name: Sq6Player1 | Creator Steam ID: 76561198082507052
ID: 7 | Name: TEST SQUAD4 | Size: 1 | Locked: False | Creator Name: Sq7Player1 | Creator Steam ID: 76561198082507052
ID: 8 | Name: TEST SQUAD5 | Size: 1 | Locked: False | Creator Name: Sq8Player1 | Creator Steam ID: 76561198082507052`);
    } else if (message.startsWith("Next level is")) {
      this.handleNextLayerMessage(message);
    }
  }

  private handleNextLayerMessage(message: string) {
    const layerInfo = message.split(", ")[1];
    const layer = layerInfo.split("layer is ")[1];

    this.nextLayer = layer.replaceAll(" ", "_");
  }

  private handlePlayersMessage(message: string) {
    const splitMessage = message.split("\n");
    this.players = [];

    for (let i = 1; i < splitMessage.length; i++) {
      if (splitMessage[i].startsWith("----- Recently Disconnected Players")) {
        break;
      }

      this.players.push(new Player(splitMessage[i]));
    }
  }

  private handleSquadsMessage(message: string) {
    const splitMessage = message.split("\n");
    this.squads = [];

    let teamId = 1;

    for (let i = 2; i < splitMessage.length; i++) {
      if (splitMessage[i].startsWith("Team ID: 2")) {
        teamId = 2;
        continue;
      }

      this.squads.push(new Squad(splitMessage[i], teamId));
    }
  }

  private handleReconnect() {
    this.logger.info("[RCON, %s] Rcon initiate reconnect...", this.serverAddres);

    clearInterval(this.rconInterval);
    this.rconInterval = undefined;

    setTimeout(() => this.rcon.connect(), 30 * 1000);
  }
}
