import { expect } from "chai";
import { ServerAddress } from "../src/model/server-address.model.js";

describe("ServerAdress constructor", () => {
  it("valid ip", () => {
    const serverAddress = new ServerAddress("12.13.145.167:27165");

    expect(serverAddress.ip).to.equal("12.13.145.167");
    expect(serverAddress.port).to.equal(27165);
  });

  it("invalid string", () => {
    expect(() => {
      new ServerAddress("invalid");
    }).to.throw("Could not extract ip and port from invalid");
  });

  it("too small ip", () => {
    expect(() => {
      new ServerAddress("1.2.3:27165");
    }).to.throw("Could not extract ip and port from 1.2.3:27165");
  });

  it("too big ip", () => {
    expect(() => {
      new ServerAddress("1.2.3.4.5:27165");
    }).to.throw("Could not extract ip and port from 1.2.3.4.5:27165");
  });

  it("too small port", () => {
    expect(() => {
      new ServerAddress("1.2.3.4:");
    }).to.throw("Could not extract ip and port from 1.2.3.4:");
  });

  it("too big port", () => {
    expect(() => {
      new ServerAddress("1.2.3.4:123456");
    }).to.throw("Could not extract ip and port from 1.2.3.4:123456");
  });
});
