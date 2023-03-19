import config from "config";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { container } from "tsyringe";
import { UserIsAuthorized } from "../guards/auth.guard.js";
import { SettingsService, SettingsServiceError } from "../services/settings.service.js";

@Discord()
export class ManageSettingsSlashCommands {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = container.resolve(SettingsService);
  }

  @Slash({
    description: "Enable or disable that the next layer is shown in the server-info-embed",
    name: "show-next-layer",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async setNextLayerEnabled(
    @SlashOption({
      description: "True if the next layer should be shown, otherwise false",
      name: "show",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    enabled: boolean,
    interaction: CommandInteraction
  ) {
    await this.settingsService.setShowNextLayer(enabled);

    await interaction.reply({
      content: `Succesfully ${
        enabled ? "enabled" : "disabled"
      } that the next layer is shown in the server-info-embed`,
      ephemeral: true,
    });
  }

  @Slash({
    description: "Enable or disable that the squad names are shown in the player-info-embed",
    name: "show-squad-names",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async setSquadNamesEnabled(
    @SlashOption({
      description: "True if squad names should be shown, otherwise false",
      name: "show",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    enabled: boolean,
    interaction: CommandInteraction
  ) {
    await this.settingsService.setShowSquadNames(enabled);

    await interaction.reply({
      content: `Succesfully ${
        enabled ? "enabled" : "disabled"
      } that squad names will be shown in player-embeds`,
      ephemeral: true,
    });
  }

  @Slash({
    description:
      "Enable or disable that the commander is shown with a separate icon in the player-info-embed",
    name: "show-commander",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async setShowCommander(
    @SlashOption({
      description: "True if the commander should have a separate icon, otherwise false",
      name: "show",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    show: boolean,
    interaction: CommandInteraction
  ) {
    await this.settingsService.setShowCommander(show);

    await interaction.reply({
      content: `Succesfully ${
        show ? "enabled" : "disabled"
      } that the commander will be shown with a separate icon in player-embeds`,
      ephemeral: true,
    });
  }

  @Slash({
    description: "Enable that squads in the player-info-embed are sorted by size from small to big",
    name: "sort-squads",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async setSortSquadsBySize(
    @SlashOption({
      description: "True if squads should be sorted by size (small to big), otherwise false",
      name: "sort",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    sort: boolean,
    interaction: CommandInteraction
  ) {
    await this.settingsService.setSortSquadsBySize(sort);

    await interaction.reply({
      content: `Succesfully ${
        sort ? "enabled" : "disabled"
      } that squads will be sorted in the player-info-embed`,
      ephemeral: true,
    });
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

    await this.settingsService.initGuildAndServerChannel(
      interaction.guildId,
      interaction.channelId
    );

    await interaction.reply({
      content: "Succesfully initialized the bot to send server information in this channel",
      ephemeral: true,
    });
  }

  @Slash({
    description: "Initialize the server-info-bot to send player information in this channel",
    name: "init-player-info",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async initPlayerChannel(interaction: CommandInteraction) {
    try {
      await this.settingsService.initPlayerChannel(interaction.channelId);
    } catch (error: any) {
      const errorMessage =
        error instanceof SettingsServiceError ? error.message : "An unexpected error occured";

      await interaction.reply({
        content: errorMessage,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Succesfully initialized the bot to send player information in this channel",
      ephemeral: true,
    });
  }

  @Slash({
    description: "Stop the bot from querying and sending player information in this channel",
    name: "remove-player-info",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async removePlayerChannel(interaction: CommandInteraction) {
    try {
      await this.settingsService.removePlayerChannel();
    } catch (error: any) {
      const errorMessage =
        error instanceof SettingsServiceError ? error.message : "An unexpected error occured";

      await interaction.reply({
        content: errorMessage,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Succesfully removed all player information and no player information will be shown",
      ephemeral: true,
    });
  }

  @Slash({
    description: "Set the interval how often the server and player information will be updated",
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
      await this.settingsService.setUpdateIntervalSec(interval);
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
      await this.settingsService.setTimeZone(timeZone);
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

  @Slash({
    description: "Reset all settings to the default values",
    name: "reset-settings",
  })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async resetSettings(interaction: CommandInteraction) {
    await this.settingsService.resetSettings();
    await interaction.reply({
      content: `Successfully reset all settings to the default values`,
      ephemeral: true,
    });
  }
}
