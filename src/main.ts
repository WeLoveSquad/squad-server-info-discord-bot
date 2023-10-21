import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import config from "config";
import { GatewayIntentBits } from "discord.js";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";
import { Logger } from "./logger/logger.js";

const BOT_TOKEN = config.get<string>("discord.botToken");

class Main {
  private logger = new Logger(Main.name);

  private client: Client;

  constructor() {
    DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

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

    process.addListener("SIGINT", this.shutdown.bind(this));
    process.addListener("SIGQUIT", this.shutdown.bind(this));
    process.addListener("SIGTERM", this.shutdown.bind(this));

    void this.start();
  }

  async start(): Promise<void> {
    await importx(dirname(import.meta.url) + "/{commands,handler}/**/*.{js,ts}");

    await this.client.login(BOT_TOKEN);
  }

  public shutdown(signal: string): void {
    this.logger.info("Received [%s]. Shutting down!", signal);
    this.client.destroy();

    process.exit(0);
  }
}

new Main();
