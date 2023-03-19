import { expect } from "chai";
import { Team } from "../../src/enums/team.enum.js";
import { TeamUtils } from "../../src/utils/team.utils.js";

describe("Team", () => {
  describe("fromNumber", () => {
    it("converts to enum correctly", () => {
      expect(TeamUtils.fromNumber(1)).to.equal(Team.ONE);
      expect(TeamUtils.fromNumber(2)).to.equal(Team.TWO);
    });

    it("throws Error with invalid number", () => {
      expect(() => {
        TeamUtils.fromNumber(3);
      }).to.throw("Team number must be either '1' or '2'");
    });
  });
});
