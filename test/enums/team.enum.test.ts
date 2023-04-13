import { expect } from "chai";
import { Team, numberToTeam } from "../../src/enums/team.enum.js";

describe("Team", () => {
  describe("numberToTeam", () => {
    it("converts to enum correctly", () => {
      expect(numberToTeam(1)).to.equal(Team.ONE);
      expect(numberToTeam(2)).to.equal(Team.TWO);
    });

    it("throws Error with invalid number", () => {
      expect(() => {
        numberToTeam(3);
      }).to.throw("Team number must be either '1' or '2'");
    });
  });
});
