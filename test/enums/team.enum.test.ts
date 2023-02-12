import { expect } from "chai";
import { Team } from "../../src/enums/team.enum.js";

describe("Team", () => {
  describe("fromNumber", () => {
    it("converts to enum correctly", () => {
      expect(Team.fromNumber(1)).to.equal(Team.ONE);
      expect(Team.fromNumber(2)).to.equal(Team.TWO);
    });

    it("throws Error with invalid number", () => {
      expect(() => {
        Team.fromNumber(3);
      }).to.throw("Team number must be either '1' or '2'");
    });
  });
});
