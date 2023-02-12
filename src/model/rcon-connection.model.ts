import Rcon from "rcon";
import { container } from "tsyringe";
import { Team } from "../enums/team.enum.js";
import { Logger } from "../services/logger.service.js";
import { SettingsService } from "../services/settings.service.js";
import { Player } from "./player.model.js";
import { Squad } from "./squad.model.js";
import { Teams } from "./teams.model.js";

const LIST_SQUADS_REQUEST = "ListSquads";
const LIST_PLAYERS_REQUEST = "ListPlayers";
const NEXT_LAYER_REQUEST = "ShowNextMap";

export class RconConnection {
  private logger: Logger;
  private settingsService: SettingsService;

  private rcon: Rcon;
  private connected: boolean = false;
  private receivedPlayerData: boolean = false;
  private rconInterval?: NodeJS.Timer;

  private squads: Squad[] = [];
  private players: Player[] = [];
  private nextLayer: string = "Unknown";

  private serverAddres: string;

  constructor(ip: string, port: number, password: string) {
    this.logger = container.resolve(Logger);
    this.settingsService = container.resolve(SettingsService);

    this.serverAddres = `${ip}:${port}`;
    this.rcon = new Rcon(ip, port, password, {
      tcp: true,
      challenge: true,
    });

    this.logger.info("[RCON, %s] Connecting to RCON-Server...", this.serverAddres);

    this.rcon.addListener("response", (message: string) => this.handleMessage(message.trim()));

    this.rcon.addListener("end", () => {
      this.logger.info("[RCON, %s] Connection closed", this.serverAddres);
      this.receivedPlayerData = false;
      this.connected = false;

      this.handleReconnect();
    });

    this.rcon.addListener("error", (error) => {
      this.logger.error("[RCON, %s] Rcon error: [%s]", this.serverAddres, error);
      this.receivedPlayerData = false;
      this.connected = false;

      this.handleReconnect();
    });

    this.rcon.addListener("auth", () => {
      this.logger.info("[RCON, %s] Successfully connected", this.serverAddres);
      this.receivedPlayerData = false;
      this.connected = true;

      this.initInterval();
    });

    this.settingsService.addListener(SettingsService.SETTINGS_UPDATED_EVENT, () => {
      if (this.connected) {
        this.initInterval();
      }
    });

    this.rcon.connect();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public hasReceivedPlayerData(): boolean {
    return this.receivedPlayerData;
  }

  public getTeams(): Teams {
    return new Teams(this.squads, this.players);
  }

  public getNextLayer(): string {
    return this.nextLayer;
  }

  private initInterval(): void {
    clearInterval(this.rconInterval);

    this.rconInterval = setInterval(() => {
      this.requestData();
    }, this.settingsService.getUpdateIntervalSec() * 1000);
  }

  private requestData(): void {
    if (!this.connected) {
      this.logger.verbose(
        "[RCON, %s] Rcon not connected! Will not request any data",
        this.serverAddres
      );
      return;
    }

    if (this.settingsService.isServerChannelInitialized() && this.settingsService.showNextLayer()) {
      this.logger.debug("[RCON, %s] Sending [%s] request", this.serverAddres, NEXT_LAYER_REQUEST);
      this.rcon.send(NEXT_LAYER_REQUEST);
    }

    if (this.settingsService.isPlayerChannelInitialized()) {
      this.logger.debug(
        "[RCON, %s] Sending [%s] and [%s] requests",
        this.serverAddres,
        LIST_SQUADS_REQUEST,
        LIST_PLAYERS_REQUEST
      );
      this.rcon.send(LIST_SQUADS_REQUEST);
      this.rcon.send(LIST_PLAYERS_REQUEST);
    }
  }

  private handleMessage(message: string): void {
    if (message.startsWith("----- Active Players -----")) {
      this.logger.debug(
        "[RCON, %s] Received response to [%s]",
        this.serverAddres,
        LIST_PLAYERS_REQUEST
      );
      this.handlePlayersMessage(message);
    } else if (this.isPartialPlayersMessage(message)) {
      this.handlePartialPlayersMessage(message);
    } else if (message.startsWith("----- Active Squads -----")) {
      this.logger.debug(
        "[RCON, %s] Received response to [%s]",
        this.serverAddres,
        LIST_SQUADS_REQUEST
      );
      this.handleSquadsMessage(message);
    } else if (message.startsWith("Next level is")) {
      this.logger.debug(
        "[RCON, %s] Received response to [%s]",
        this.serverAddres,
        NEXT_LAYER_REQUEST
      );
      this.handleNextLayerMessage(message);
    }
  }

  private handleNextLayerMessage(message: string): void {
    const splitMessage = message.split(", ");
    if (splitMessage.length < 2) {
      this.logger.warn("[RCON, %s] Could not parse next layer: [%s]", this.serverAddres, message);
      this.nextLayer = "Unknown";
      return;
    }

    const layerInfo = splitMessage[1];
    const splitLayerInfo = layerInfo.split("layer is ");

    if (splitLayerInfo.length < 2) {
      this.logger.warn("[RCON, %s] Could not parse next layer: [%s]", this.serverAddres, message);
      this.nextLayer = "Unknown";
      return;
    }

    const layer = splitLayerInfo[1];
    this.nextLayer = layer.replaceAll(" ", "_");
  }

  private handlePlayersMessage(message: string): void {
    this.receivedPlayerData = true;
    this.players = this.parsePlayers(message);
  }

  private handlePartialPlayersMessage(message: string): void {
    const players = this.parsePlayers(message);

    this.players = this.players.concat(players);
  }

  private parsePlayers(message: string): Player[] {
    const splitMessage = message.split("\n");
    const players: Player[] = [];

    for (const line of splitMessage) {
      if (line.startsWith("----- Recently Disconnected Players")) {
        break;
      }

      if (Player.isValidPlayerString(line)) {
        players.push(new Player(line));
      }
    }

    return players;
  }

  private isPartialPlayersMessage(message: string): boolean {
    const splitMessage = message.split("\n");

    if (Player.isValidPlayerString(splitMessage[0])) {
      return true;
    }

    return false;
  }

  private handleSquadsMessage(message: string): void {
    const splitMessage = message.split("\n");
    this.squads = [];

    let team = Team.ONE;

    for (const line of splitMessage) {
      if (line.startsWith("Team ID: 2")) {
        team = Team.TWO;
        continue;
      }

      if (Squad.isValidSquadString(line)) {
        this.squads.push(new Squad(line, team));
      }
    }
  }

  private handleReconnect(): void {
    this.logger.info("[RCON, %s] Initiating reconnect...", this.serverAddres);

    clearInterval(this.rconInterval);
    this.rconInterval = undefined;

    setTimeout(() => this.rcon.connect(), 30 * 1000);
  }
}
