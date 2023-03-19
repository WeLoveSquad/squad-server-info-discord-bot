import { container } from "tsyringe";
import { Logger } from "../services/logger.service.js";

const FACTIONS = ["AUS", "CAF", "GB", "INS", "MEA", "MIL", "RUS", "USA", "USMC", "PLA"];

export class FactionParser {
  private static logger = container.resolve(Logger);

  public static parseFaction(teamString: string): string {
    for (const faction of FACTIONS) {
      if (teamString.includes(faction)) {
        return faction;
      }
    }

    if (teamString.includes("RU") || teamString === "Logar_Seed_v1") {
      return "RUS";
    } else if (teamString === "Tallil_RAAS_v8") {
      return "GB";
    }

    this.logger.warn("Could not parse faction from team: [%s]", teamString);
    return "Unknown";
  }
}
