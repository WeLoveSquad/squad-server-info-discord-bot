import { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";
import { container } from "tsyringe";
import { Logger } from "../services/logger.service.js";

export const UserIsAuthorized: (authorizedRoles: string) => GuardFunction<CommandInteraction> = (
  authorizedRoles: string
) => {
  return async (interaction, client, next) => {
    const messageGuild = interaction.guild;
    if (!messageGuild) {
      container
        .resolve(Logger)
        .warn(
          "interaction message guild not found for interaction: [%s] by user: [%s] with id: [%s]",
          interaction.type,
          interaction.user.username,
          interaction.user.id
        );
      return;
    }

    try {
      const member = await messageGuild.members.fetch({ user: interaction.user.id });

      if (member.roles.cache.hasAny(...authorizedRoles.split(","))) {
        await next();
      } else {
        interaction.reply({
          content: "You do not have the required permissions to perform this action",
          ephemeral: true,
        });
      }
    } catch (error: any) {
      container
        .resolve(Logger)
        .warn(
          "An error ocured while trying to check authentication of interaction: [%s] by user: [%s] with id: [%s]. Error: [%s]",
          interaction.type,
          interaction.user.username,
          interaction.user.id,
          error
        );
    }
  };
};
