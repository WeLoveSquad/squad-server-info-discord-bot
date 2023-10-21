import config from "config";
import { CommandInteraction, GuildMember } from "discord.js";
import { GuardFunction } from "discordx";
import { Logger } from "../logger/logger.js";

const AUTHORIZED_ROLE_IDS = config.get<string>("discord.authorizedRoles");

export const UserIsAuthorized: () => GuardFunction<CommandInteraction> = () => {
  return async (interaction, _, next) => {
    if (!(interaction.member instanceof GuildMember)) {
      return;
    }

    const logger = new Logger(UserIsAuthorized.name);

    try {
      if (interaction.member.roles.cache.hasAny(...AUTHORIZED_ROLE_IDS.split(","))) {
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
