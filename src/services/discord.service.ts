import {
  ActionRowBuilder,
  ButtonBuilder,
  Client,
  DiscordAPIError,
  EmbedBuilder,
  Message,
  TextChannel,
} from "discord.js";
import { injectable } from "tsyringe";
import { Logger } from "../logger/logger.js";

@injectable()
export class DiscordService {
  private logger = new Logger(DiscordService.name);

  public async loadTextChannel(client: Client, channelId: string): Promise<TextChannel> {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new Error(`Could not find text channel with id '${channelId}'`);
    }

    return channel;
  }

  public async deleteMessage(message: Message): Promise<void> {
    try {
      await message.delete();
    } catch (error: unknown) {
      this.logger.warn("Could not delete message: [%s]. Error: [%s]", message.id, error);
    }
  }

  public async editMessage(
    message: Message,
    embeds: EmbedBuilder[],
    buttonRow: ActionRowBuilder<ButtonBuilder>[]
  ): Promise<void> {
    try {
      await message.edit({ embeds: embeds, components: buttonRow });
    } catch (error: unknown) {
      if (error instanceof DiscordAPIError && error.status === 404) {
        this.logger.error("Could not edit message: [%s] because it has been deleted");
      }
    }
  }
}
