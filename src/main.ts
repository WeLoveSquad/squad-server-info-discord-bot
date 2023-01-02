import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import config from "config";
import { GatewayIntentBits } from "discord.js";
import { Client } from "discordx";
import { container, singleton } from "tsyringe";
import { Logger } from "./services/logger.service.js";

@singleton()
class Main {
  private client: Client;

  constructor(private logger: Logger) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
      silent: false,
    });

    this.logger.debug(
      "Config sources loaded: %s",
      config.util.getConfigSources().map((c) => c.name)
    );

    this.client.once("ready", async () => {
      await this.client.guilds.fetch();
      await this.client.initApplicationCommands();

      this.logger.info("Bot started");
    });

    this.client.on("interactionCreate", (interaction) => {
      this.client.executeInteraction(interaction);
    });
  }

  async start(): Promise<void> {
    await importx(dirname(import.meta.url) + "/{commands,handler}/**/*.{js,ts}");

    await this.client.login(config.get<string>("discord.botToken"));
  }

  public shutdown(signal: string): void {
    this.logger.info("Received [%s]. Shutting down!", signal);
    this.client.destroy();
  }
}

const main = container.resolve(Main);
main.start();

function handleExit(signal: string) {
  main.shutdown(signal);
  process.exit(0);
}
process.on("SIGINT", handleExit);
process.on("SIGQUIT", handleExit);
process.on("SIGTERM", handleExit);
