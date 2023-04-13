export enum Team {
  ONE = 1,
  TWO = 2,
}

export function numberToTeam(num: number): Team {
  if (num === 1) {
    return Team.ONE;
  } else if (num === 2) {
    return Team.TWO;
  } else {
    throw new Error("Team number must be either '1' or '2'");
  }
}
