export class Settings {
  guildId: string | undefined;
  serverChannelId: string | undefined;
  playerChannelId: string | undefined;
  updateIntervalSec = 15;
  timeZone = "Europe/Berlin";
  showNextLayer = true;
  showSquadNames = true;
  sortSquadsBySize = false;
  showCommander = true;

  constructor(jsonString?: string) {
    if (!jsonString) {
      return;
    }

    const settings = JSON.parse(jsonString);
    if (!settings) {
      return;
    }

    this.guildId = settings.guildId;
    this.serverChannelId = settings.serverChannelId;
    this.playerChannelId = settings.playerChannelId;
    this.updateIntervalSec = settings.updateIntervalSec ?? 15;
    this.timeZone = settings.timeZone ?? "Europe/Berlin";
    this.showNextLayer = settings.showNextLayer ?? true;
    this.showSquadNames = settings.showSquadNames ?? true;
    this.sortSquadsBySize = settings.sortSquadsBySize ?? false;
    this.showCommander = settings.showCommander ?? true;
  }

  public toJsonString(): string {
    return JSON.stringify(this);
  }
}
