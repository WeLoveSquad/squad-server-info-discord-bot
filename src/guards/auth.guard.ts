import config from "config";
import { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";
import { Logger } from "../logger/logger.js";

const AUTHORIZED_ROLE_IDS = config.get<string>("discord.authorizedRoles");

export const UserIsAuthorized: () => GuardFunction<CommandInteraction> = () => {
  return async (interaction, _, next) => {
    const logger = new Logger(UserIsAuthorized.name);

    const messageGuild = interaction.guild;
    if (!messageGuild) {
      logger.warn(
        "interaction message guild not found for interaction: [%s] by user: [%s] with id: [%s]",
        interaction.type,
        interaction.user.username,
        interaction.user.id
      );
      return;
    }

    try {
      const member = await messageGuild.members.fetch({ user: interaction.user.id });

      if (member.roles.cache.hasAny(...AUTHORIZED_ROLE_IDS.split(","))) {
        await next();
      } else {
        await interaction.reply({
          content: "You do not have the required permissions to perform this action!",
          ephemeral: true,
        });
      }
    } catch (error: unknown) {
      logger.warn(
        "An error occurred while trying to check authentication of interaction: [%s] by user: [%s] with id: [%s]. Error: [%s]",
        interaction.type,
        interaction.user.username,
        interaction.user.id,
        error
      );
    }
  };
};
