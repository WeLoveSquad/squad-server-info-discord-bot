import config from "config";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { container } from "tsyringe";
import { UserIsAuthorized } from "../guards/auth.guard.js";
import { ServerAddress } from "../model/server-address.model.js";
import { StorageService } from "../services/storage.service.js";

@Discord()
export class ManageServersSlashCommands {
  private storageService: StorageService;

  constructor() {
    this.storageService = container.resolve(StorageService);
  }

  @Slash({ description: "Add a new server to the server-info-bot", name: "add-server" })
  @Guard(UserIsAuthorized(config.get<string>("discord.authorizedRoles")))
  async addServer(
    @SlashOption({
      description: "Server Query Address in the format of 'IP:Port'",
      name: "server-address",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    serverQueryAddress: string,
    interaction: CommandInteraction
  ): Promise<void> {
    let serverAddress: ServerAddress;
    try {
      serverAddress = new ServerAddress(serverQueryAddress);
    } catch (error: any) {
      interaction.reply({
        content: `${serverQueryAddress} is not a valid Squad Server Query Address. Valid example: '12.13.145.167:12345`,
        ephemeral: true,
      });
      return;
    }

    if (this.storageService.contains(serverAddress)) {
      interaction.reply({
        content: `${serverQueryAddress} is already stored in the server-info-bot`,
        ephemeral: true,
      });
      return;
    }

    await this.storageService.addServer(serverAddress);

    await interaction.reply({
      content: `${serverQueryAddress} has been added to the server-info-bot`,
      ephemeral: true,
    });
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
      interaction.reply({
        content: `Server #${position} has been removed from the server-info-bot by`,
        ephemeral: true,
      });
    } else {
      interaction.reply({
        content: `Server #${position} was not found in the server-info-bot and could not be removed`,
        ephemeral: true,
      });
    }
  }
}
