import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { UserIsAuthorized } from "../guards/auth.guard.js";
import { SettingsService, SettingsServiceError } from "../services/settings.service.js";

@Discord()
@injectable()
export class ManageSettingsSlashCommands {
  constructor(private settingsService: SettingsService) {}

  @Slash({
    description: "Enable or disable that the next layer is shown in the server-info-embed",
    name: "show-next-layer",
  })
  @Guard(UserIsAuthorized())
  async setNextLayerEnabled(
    @SlashOption({
      description: "True if the next layer should be shown, otherwise false",
      name: "show",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    enabled: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
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
  @Guard(UserIsAuthorized())
  async setSquadNamesEnabled(
    @SlashOption({
      description: "True if squad names should be shown, otherwise false",
      name: "show",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    enabled: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
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
  @Guard(UserIsAuthorized())
  async setShowCommander(
    @SlashOption({
      description: "True if the commander should have a separate icon, otherwise false",
      name: "show",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    show: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
    await this.settingsService.setShowCommander(show);

    await interaction.reply({
      content: `Succesfully ${
        show ? "enabled" : "disabled"
      } that the commander will be shown with a separate icon in player-embeds`,
      ephemeral: true,
    });
  }

  @Slash({
    description:
      "Enable or disable that an icon is shown next to the squad leaders name in the player-info-embed",
    name: "show-squad-leader",
  })
  @Guard(UserIsAuthorized())
  async setShowSquadLeader(
    @SlashOption({
      description:
        "True if the squad leader should have an icon next to their name, otherwise false",
      name: "show",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    show: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
    await this.settingsService.setShowSquadLeader(show);

    await interaction.reply({
      content: `Succesfully ${
        show ? "enabled" : "disabled"
      } that the squad leader will have an icon next to their name in player-embeds`,
      ephemeral: true,
    });
  }

  @Slash({
    description: "Enable that squads in the player-info-embed are sorted by size from small to big",
    name: "sort-squads",
  })
  @Guard(UserIsAuthorized())
  async setSortSquadsBySize(
    @SlashOption({
      description: "True if squads should be sorted by size (small to big), otherwise false",
      name: "sort",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    sort: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
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
  @Guard(UserIsAuthorized())
  async init(interaction: CommandInteraction): Promise<void> {
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
  @Guard(UserIsAuthorized())
  async initPlayerChannel(interaction: CommandInteraction): Promise<void> {
    try {
      await this.settingsService.initPlayerChannel(interaction.channelId);
    } catch (error: unknown) {
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
  @Guard(UserIsAuthorized())
  async removePlayerChannel(interaction: CommandInteraction): Promise<void> {
    try {
      await this.settingsService.removePlayerChannel();
    } catch (error: unknown) {
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
  @Guard(UserIsAuthorized())
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
  ): Promise<void> {
    try {
      await this.settingsService.setUpdateIntervalSec(interval);
      await interaction.reply({
        content: `Update interval has been succesfully changed to ${interval} seconds`,
        ephemeral: true,
      });
    } catch (error: unknown) {
      await interaction.reply({
        content: `${interval} seconds is not a valid interval. The smallest allowed interval is 15 seconds`,
        ephemeral: true,
      });
    }
  }

  @Slash({
    description: "Set the time zone that will be used for dates inside the embed",
    name: "set-time-zone",
  })
  @Guard(UserIsAuthorized())
  async setTimeZone(
    @SlashOption({
      description: "IANA time zone name. e.g. Europe/Berlin",
      name: "time-zone",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    timeZone: string,
    interaction: CommandInteraction
  ): Promise<void> {
    try {
      await this.settingsService.setTimeZone(timeZone);
      await interaction.reply({
        content: `Time zone has been successfully changed to ${timeZone}`,
        ephemeral: true,
      });
    } catch (error: unknown) {
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
  @Guard(UserIsAuthorized())
  async resetSettings(interaction: CommandInteraction): Promise<void> {
    await this.settingsService.resetSettings();
    await interaction.reply({
      content: `Successfully reset all settings to the default values`,
      ephemeral: true,
    });
  }
}
