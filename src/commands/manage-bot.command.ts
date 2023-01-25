import config from "config";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  Events,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Client, Discord, Guard, Once, Slash, SlashOption } from "discordx";
import { container } from "tsyringe";
import { UserIsAuthorized } from "../guards/auth.guard.js";
import { SquadServer } from "../model/squad-server.model.js";
import { StorageService } from "../services/storage.service.js";

@Discord()
export class ManageBotSlashCommands {
  private storageService: StorageService;

  constructor() {
    this.storageService = container.resolve(StorageService);
  }

  @Once({ event: "ready" })
  async onceReady(_: unknown, client: Client): Promise<void> {
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isModalSubmit()) {
        return;
      }
      if (interaction.customId === "addServer") {
        const ip = interaction.fields.getTextInputValue("serverIpInput");
        const queryPortString = interaction.fields.getTextInputValue("queryPortInput");
        const rconPortString = interaction.fields.getTextInputValue("rconPortInput");
        const rconPassword = interaction.fields.getTextInputValue("rconPasswordInput");

        if (rconPortString !== "" && rconPassword === "") {
          // error
        }

        let queryPort: number;
        let rconPort: number | undefined;

        try {
          queryPort = Number(queryPortString);
        } catch (error: any) {
          return;
        }

        if (rconPortString && rconPassword) {
          try {
            rconPort = Number(rconPortString);
          } catch (error: any) {
            return;
          }
        }

        const server = new SquadServer({
          ip: ip,
          queryPort: queryPort,
          rconPort: rconPort,
          rconPassword: rconPassword === "" ? undefined : rconPassword,
        });

        console.log(server);

        this.storageService.addServer(server);

        await interaction.reply({ content: "Your submission was received successfully!" });
      }
    });
  }

  // @Slash({ description: "Add a new server to the server-info-bot", name: "add-server" })
  // @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  // async addServer(
  //   @SlashOption({
  //     description: "Server Query Address in the format of 'IP:Port'",
  //     name: "server-address",
  //     required: true,
  //     type: ApplicationCommandOptionType.String,
  //   })
  //   serverQueryAddress: string,
  //   interaction: CommandInteraction
  // ): Promise<void> {
  //   let serverAddress: ServerAddress;
  //   try {
  //     serverAddress = new ServerAddress(serverQueryAddress);
  //   } catch (error: any) {
  //     await interaction.reply({
  //       content: `${serverQueryAddress} is not a valid Squad Server Query Address. Valid example: "12.13.145.167:12345"`,
  //       ephemeral: true,
  //     });
  //     return;
  //   }

  //   if (this.storageService.contains(serverAddress)) {
  //     await interaction.reply({
  //       content: `${serverQueryAddress} is already stored in the server-info-bot`,
  //       ephemeral: true,
  //     });
  //     return;
  //   }

  //   await this.storageService.addServer(serverAddress);

  //   await interaction.reply({
  //     content: `${serverQueryAddress} has been added to the server-info-bot`,
  //     ephemeral: true,
  //   });
  // }

  @Slash({ description: "Add a new server to the server-info-bot", name: "add-server" })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async addServer(interaction: CommandInteraction): Promise<void> {
    await interaction.showModal(this.buildAddServerModal());
  }

  @Slash({
    description: "Remove a server from the server-info-bot",
    name: "remove-server",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async removeServer(
    @SlashOption({
      description: "Position of the server indicated by the number at the bottom left of the embed",
      name: "server-position",
      required: true,
      type: ApplicationCommandOptionType.Number,
    })
    position: number,
    interaction: CommandInteraction
  ): Promise<void> {
    if (await this.storageService.removeServerAtPosition(position - 1)) {
      await interaction.reply({
        content: `Server #${position} has been removed from the server-info-bot`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Server #${position} was not found in the server-info-bot and could not be removed`,
        ephemeral: true,
      });
    }
  }

  @Slash({
    description: "Show a list of squads and players in an extra embed for a server",
    name: "show-players",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async showPlayers(
    @SlashOption({
      description: "Position of the server indicated by the number at the bottom left of the embed",
      name: "server-position",
      required: true,
      type: ApplicationCommandOptionType.Number,
    })
    position: number,
    interaction: CommandInteraction
  ): Promise<void> {
    if (await this.storageService.setShowPlayers(position - 1, true)) {
      await interaction.reply({
        content: `Server #${position} has been removed from the server-info-bot`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Server #${position} was not found in the server-info-bot and could not be removed`,
        ephemeral: true,
      });
    }
  }

  @Slash({
    description: "Initialize the server-info-bot to send server information in this channel",
    name: "init",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async init(interaction: CommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "The bot can only be initialized in a Discord Server!",
        ephemeral: true,
      });
      return;
    }

    await this.storageService.initGuildAndChannel(interaction.guildId, interaction.channelId);

    await interaction.reply({
      content: "Succesfully initialized the bot in this channel",
      ephemeral: true,
    });
  }

  @Slash({
    description: "Set the interval how often the server information will be updated",
    name: "set-interval",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async setUpdateInterval(
    @SlashOption({
      description:
        "Interval in seconds in which the bot will query information from the Squad-Servers",
      name: "interval",
      required: true,
      type: ApplicationCommandOptionType.Number,
    })
    interval: number,
    interaction: CommandInteraction
  ) {
    try {
      await this.storageService.setUpdateIntervalSec(interval);
      await interaction.reply({
        content: `Update interval has been succesfully changed to ${interval} seconds`,
        ephemeral: true,
      });
    } catch (error: any) {
      await interaction.reply({
        content: `${interval} seconds is not a valid interval. The smallest allowed interval is 5 seconds`,
        ephemeral: true,
      });
    }
  }

  @Slash({
    description: "Set the time zone that will be used for dates inside the embed",
    name: "set-time-zone",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async setTimeZone(
    @SlashOption({
      description: "IANA time zone name. e.g. Europe/Berlin",
      name: "time-zone",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    timeZone: string,
    interaction: CommandInteraction
  ) {
    try {
      await this.storageService.setTimeZone(timeZone);
      await interaction.reply({
        content: `Time zone has been successfully changed to ${timeZone}`,
        ephemeral: true,
      });
    } catch (error: any) {
      await interaction.reply({
        content: `${timeZone} is not a valid IANA time zone!`,
        ephemeral: true,
      });
    }
  }

  private buildAddServerModal(): ModalBuilder {
    const ipInput = new TextInputBuilder()
      .setCustomId("serverIpInput")
      .setLabel("Squad Server IP")
      .setRequired(true)
      .setMinLength(6)
      .setMaxLength(15)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("1.2.3.4");

    const queryPortInput = new TextInputBuilder()
      .setCustomId("queryPortInput")
      .setLabel("Squad Server Query-Port")
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(5)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("27165");

    const rconPortInput = new TextInputBuilder()
      .setCustomId("rconPortInput")
      .setLabel("Squad Server Rcon-Port (Optional)")
      .setRequired(false)
      .setMinLength(1)
      .setMaxLength(5)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("12345");

    const rconPasswordInput = new TextInputBuilder()
      .setCustomId("rconPasswordInput")
      .setLabel("Squad Server Rcon-Password (Optional)")
      .setRequired(false)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("password");

    return new ModalBuilder()
      .setCustomId("addServer")
      .setTitle("Add a new server to the bot")
      .addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(ipInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(queryPortInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(rconPortInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(rconPasswordInput)
      );
  }
}
