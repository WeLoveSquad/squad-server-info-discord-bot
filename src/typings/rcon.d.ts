declare module "rcon" {
  import { EventEmitter } from "events";

  class Rcon extends EventEmitter {
    constructor(
      host: string,
      port: number,
      password: string,
      options?: { tcp?: boolean; challenge?: boolean; id?: number }
    );
    send(data: string, cmd?: number, id?: number): void;
    connect(): void;
    disconnect(): void;
  }

  export default Rcon;
}
