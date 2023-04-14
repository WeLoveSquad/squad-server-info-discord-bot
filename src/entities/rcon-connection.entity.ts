import Rcon from "rcon";
import { container } from "tsyringe";
import { Logger } from "../logger/logger.js";
import { SettingsService } from "../services/settings.service.js";
import { Player } from "./player.entity.js";
import { Teams } from "./teams.entity.js";

const LIST_SQUADS_REQUEST = "ListSquads";
const LIST_PLAYERS_REQUEST = "ListPlayers";
const NEXT_LAYER_REQUEST = "ShowNextMap";

export class RconConnection {
  private logger: Logger;
  private settingsService: SettingsService;

  private rcon: Rcon;
  private connected = false;
  private receivedPlayerData = false;
  private rconInterval?: NodeJS.Timer;

  private latestSquadsResponse?: string;
  private latestPlayersResponse?: string;
  private latestTeams?: Teams;
  private nextLayer = "Unknown";

  constructor(ip: string, port: number, password: string) {
    this.logger = new Logger(`${Rcon.name}, ${ip}:${port}`);
    this.settingsService = container.resolve(SettingsService);

    this.rcon = new Rcon(ip, port, password, {
      tcp: true,
      challenge: true,
    });

    this.logger.info("Connecting to RCON-Server...");

    this.rcon.addListener("response", (message: string) => this.handleMessage(message.trim()));

    this.rcon.addListener("end", () => {
      this.logger.info("Connection closed");
      this.receivedPlayerData = false;
      this.connected = false;

      this.handleReconnect();
    });

    this.rcon.addListener("error", (error) => {
      this.logger.error("Rcon error: [%s]", error);
      this.receivedPlayerData = false;
      this.connected = false;

      this.handleReconnect();
    });

    this.rcon.addListener("auth", () => {
      this.logger.info("Successfully connected");
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

  public getTeams(): Teams | undefined {
    return this.latestTeams;
  }

  public getNextLayer(): string {
    return this.nextLayer;
  }

  private initInterval(): void {
    clearInterval(this.rconInterval);

    this.requestData();
    this.rconInterval = setInterval(() => {
      this.requestData();
    }, this.settingsService.getUpdateIntervalSec() * 1000);
  }

  private requestData(): void {
    if (!this.connected) {
      this.logger.verbose("Rcon not connected! Will not request any data");
      return;
    }

    if (this.settingsService.isServerChannelInitialized() && this.settingsService.showNextLayer()) {
      this.logger.debug("Sending [%s] request", NEXT_LAYER_REQUEST);
      this.rcon.send(NEXT_LAYER_REQUEST);
    }

    if (this.settingsService.isPlayerChannelInitialized()) {
      this.logger.debug(
        "Sending [%s] and [%s] requests",
        LIST_SQUADS_REQUEST,
        LIST_PLAYERS_REQUEST
      );
      this.rcon.send(LIST_SQUADS_REQUEST);
      this.rcon.send(LIST_PLAYERS_REQUEST);
    }
  }

  private handleMessage(message: string): void {
    if (message.startsWith("----- Active Players -----")) {
      this.logger.debug("Received response to [%s]", LIST_PLAYERS_REQUEST);
      this.handlePlayersMessage(message, false);
    } else if (this.isPartialPlayersMessage(message)) {
      this.handlePlayersMessage(message, true);
    } else if (message.startsWith("----- Active Squads -----")) {
      this.logger.debug("Received response to [%s]", LIST_SQUADS_REQUEST);
      this.latestSquadsResponse = message;
    } else if (message.startsWith("Next level is")) {
      this.logger.debug("Received response to [%s]", NEXT_LAYER_REQUEST);
      this.handleNextLayerMessage(message);
    }
  }

  private handlePlayersMessage(message: string, partial: boolean): void {
    if (this.latestPlayersResponse && partial) {
      this.latestPlayersResponse += `\n${message}`;
    } else {
      this.latestPlayersResponse = message;
    }

    if (message.includes("----- Recently Disconnected Players [Max of 15] -----")) {
      this.latestTeams = new Teams(this.latestSquadsResponse, this.latestPlayersResponse);
      this.receivedPlayerData = true;
    }
  }

  private handleNextLayerMessage(message: string): void {
    const splitMessage = message.split(", ");
    if (splitMessage.length < 2) {
      this.logger.warn("Could not parse next layer: [%s]", message);
      this.nextLayer = "Unknown";
      return;
    }

    const layerInfo = splitMessage[1];
    const splitLayerInfo = layerInfo.split("layer is ");

    if (splitLayerInfo.length < 2) {
      this.logger.warn("Could not parse next layer: [%s]", message);
      this.nextLayer = "Unknown";
      return;
    }

    const layer = splitLayerInfo[1];
    this.nextLayer = layer.replaceAll(" ", "_");
  }

  private isPartialPlayersMessage(message: string): boolean {
    const splitMessage = message.split("\n");

    if (Player.isValidPlayerString(splitMessage[0])) {
      return true;
    }

    return false;
  }

  private handleReconnect(): void {
    this.logger.info("Initiating reconnect...");

    clearInterval(this.rconInterval);
    this.rconInterval = undefined;

    setTimeout(() => this.rcon.connect(), 30 * 1000);
  }
}
