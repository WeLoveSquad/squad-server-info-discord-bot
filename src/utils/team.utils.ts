import { Team } from "../enums/team.enum.js";

export class TeamUtils {
  public static fromNumber(num: number) {
    if (num === 1) {
      return Team.ONE;
    } else if (num === 2) {
      return Team.TWO;
    } else {
      throw new Error("Team number must be either '1' or '2'");
    }
  }
}
