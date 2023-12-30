import EventEmitter from "events";
import { Socket } from "net";
import { Logger } from "../logger/logger.js";

enum PacketType {
  SERVERDATA_RESPONSE_VALUE = 0,
  SERVERDATA_CHAT_VALUE = 1,
  SERVERDATA_EXECCOMMAND = 2,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  SERVERDATA_AUTH_RESPONSE = 2,
  SERVERDATA_AUTH = 3,
}

interface Packet {
  size: number;
  id: number;
  type: PacketType;
  body: string;
}

export interface RconOptions {
  host: string;
  port: number;
  password: string;
  autoConnect?: boolean;
  autoReconnect?: boolean;
}

enum InternalRconEvents {
  RESPONSE_EVENT = "responseEvent",
  AUTH_RESPONSE_EVENT = "authResponseEvent",
}

export class RconError extends Error {}

const AUTH_PACKET_ID = 1;
const RECONNECT_TIMEOUT = 10 * 1000;
const COMMAND_EXECUTION_TIMEOUT = 2 * 1000;

export class Rcon {
  private logger: Logger;

  private host: string;
  private port: number;
  private password: string;
  private autoReconnect: boolean;
  private connected = false;

  private socket = new Socket();
  private responseData: Buffer = Buffer.from([]);

  private packetEvent = new EventEmitter();
  private requestId = 2;

  constructor(options: RconOptions) {
    this.host = options.host;
    this.port = options.port;
    this.password = options.password;
    this.autoReconnect = options.autoReconnect ?? true;

    this.logger = new Logger(`${Rcon.name}, ${this.host}:${this.port}`);

    if (options.autoConnect !== false) {
      void this.connect();
    }
  }

  public connect(): Promise<void> {
    this.logger.info("Connecting...");
    this.packetEvent.removeAllListeners();
    this.socket.removeAllListeners();
    this.responseData = Buffer.from([]);

    this.socket.on("data", (data) => {
      this.decodeData(data);
    });

    return new Promise((resolve, reject) => {
      this.socket.once("close", () => {
        this.connected = false;
        this.socket.removeAllListeners();
        return reject(new RconError("RCON Authentication failed"));
      });

      this.socket.once("error", () => {
        this.connected = false;
        this.socket.removeAllListeners();
        return reject(new RconError(`Could not connect to ${this.host}:${this.port}`));
      });

      this.packetEvent.once(InternalRconEvents.AUTH_RESPONSE_EVENT, (packet: Packet) => {
        if (packet.id === AUTH_PACKET_ID) {
          this.socket.removeAllListeners("close");
          this.socket.removeAllListeners("error");

          this.socket.on("close", async () => {
            this.logger.info("Connection closed");
            this.connected = false;
            if (this.autoReconnect) {
              await this.reconnect();
            }
          });
          this.socket.on("error", (error: Error) => {
            this.logger.info("Connection error: [%s]", error);
            this.connected = false;
          });

          this.connected = true;
          this.logger.info("Successfully connected");
          return resolve();
        } else {
          return reject(new RconError("RCON Authentication failed"));
        }
      });

      this.socket.connect(this.port, this.host, () => {
        const authRequest = this.encodeRequest(
          PacketType.SERVERDATA_AUTH,
          AUTH_PACKET_ID,
          this.password
        );
        this.socket.write(authRequest);
      });
    });
  }

  public execute(command: string): Promise<string> {
    this.logger.verbose("Executing [%s] command", command);
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket.writable) {
        return reject(new RconError("RCON is not connected."));
      }

      const requestId = this.getNextRequestId();
      const emptyRequestId = this.getNextRequestId();

      let response = "";

      const packetEventHandler = (packet: Packet): void => {
        if (packet.id === requestId) {
          response += packet.body;
        } else if (packet.id === emptyRequestId) {
          clearTimeout(responseTimeout);
          this.packetEvent.removeListener(InternalRconEvents.RESPONSE_EVENT, packetEventHandler);
          this.logger.verbose("Received response to [%s] command: [%s]", command, response);
          return resolve(response);
        }
      };

      const responseTimeout = setTimeout(() => {
        this.logger.warn("Execution of command: [%s] timed out", command);
        this.packetEvent.removeListener(InternalRconEvents.RESPONSE_EVENT, packetEventHandler);
        return reject(new RconError(`Execution of command '${command} timed out'`));
      }, COMMAND_EXECUTION_TIMEOUT);

      this.packetEvent.on(InternalRconEvents.RESPONSE_EVENT, packetEventHandler);

      const commandRequest = this.encodeRequest(
        PacketType.SERVERDATA_EXECCOMMAND,
        requestId,
        command
      );
      const emptyRequest = this.encodeEmptyRequest(emptyRequestId);

      this.socket.write(commandRequest);
      this.socket.write(emptyRequest);
    });
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public disconnect(): void {
    this.socket.end();
  }

  private encodeRequest(type: PacketType, id: number, body: string): Buffer {
    const size = Buffer.byteLength(body) + 14;
    const buffer = Buffer.alloc(size);

    buffer.writeInt32LE(size - 4, 0);
    buffer.writeInt32LE(id, 4);
    buffer.writeInt32LE(type, 8);
    buffer.write(body, 12, size - 2, "utf-8");
    buffer.writeInt16LE(0, size - 2);

    return buffer;
  }

  private encodeEmptyRequest(id: number): Buffer {
    return this.encodeRequest(PacketType.SERVERDATA_RESPONSE_VALUE, id, "");
  }

  private decodeData(data: Buffer): void {
    this.responseData = Buffer.concat([this.responseData, data]);
    if (this.responseData.length >= 50000) {
      this.responseData = Buffer.from([]);
      return;
    }

    let offset = 0;
    while (offset <= this.responseData.length - 4) {
      const packet = this.readPacket(this.responseData, offset);
      if (packet) {
        offset += packet.size + 4;
        if (packet.type === PacketType.SERVERDATA_AUTH_RESPONSE) {
          this.packetEvent.emit(InternalRconEvents.AUTH_RESPONSE_EVENT, packet);
        } else if (packet.type === PacketType.SERVERDATA_RESPONSE_VALUE) {
          this.packetEvent.emit(InternalRconEvents.RESPONSE_EVENT, packet);
        }
      } else {
        break;
      }
    }

    this.responseData = this.responseData.subarray(offset, this.responseData.length);
  }

  private readPacket(buffer: Buffer, start: number): Packet | undefined {
    let size = buffer.readInt32LE(start);

    if (start + size + 2 > buffer.length) {
      return undefined;
    }

    if (size === 10 && this.isScuffedEmptyPacket(buffer, start)) {
      size = 17;
    }

    return {
      size: size,
      id: buffer.readInt32LE(start + 4),
      type: buffer.readInt32LE(start + 8),
      body: buffer.toString("utf-8", start + 12, start + size + 2),
    };
  }

  // Squad server reports that the empty packet has a size of 10, even though the correct size is 17
  private isScuffedEmptyPacket(buffer: Buffer, start: number): boolean {
    if (start + 21 > buffer.length) {
      return false;
    }

    const body = buffer.toString("utf-8", start + 12, start + 21);

    return body === "\x00\x00\x00\x01\x00\x00\x00\x00\x00";
  }

  private async reconnect(): Promise<void> {
    this.logger.info("Attempting to reconnect");
    try {
      await this.connect();
    } catch (error: unknown) {
      this.logger.warn("Reconnect failed");
      setTimeout(async () => {
        await this.reconnect();
      }, RECONNECT_TIMEOUT);
    }
  }

  private getNextRequestId(): number {
    this.requestId = this.requestId < 100_000 ? this.requestId + 1 : 2;
    return this.requestId;
  }
}
