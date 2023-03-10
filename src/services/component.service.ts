import {
  ActionRowBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { DateTime, Duration } from "luxon";
import { injectable } from "tsyringe";
import { Team } from "../enums/team.enum.js";
import { Player } from "../model/player.model.js";
import { ServerInfo } from "../model/server-info.model.js";
import { SquadServer } from "../model/squad-server.model.js";
import { Squad } from "../model/squad.model.js";
import { Teams } from "../model/teams.model.js";
import { Logger } from "./logger.service.js";
import { SettingsService } from "./settings.service.js";

@injectable()
export class ComponentService {
  constructor(private logger: Logger, private settingsService: SettingsService) {}

  public buildServerInfoEmbed(serverInfo: ServerInfo, position: number): EmbedBuilder {
    const duration = Duration.fromObject({ seconds: serverInfo.playtimeSeconds });

    const embed = new EmbedBuilder()
      .setTitle(serverInfo.serverName)
      .setColor("#FF5555")
      .setThumbnail(`https://squadmaps.com/img/maps/full_size/${serverInfo.layer}.jpg`)
      .addFields(
        { name: "Layer", value: serverInfo.layer, inline: true },
        {
          name: "Teams",
          value: `${serverInfo.teamOne} - ${serverInfo.teamTwo}`,
          inline: true,
        }
      );

    if (this.settingsService.showNextLayer() && serverInfo.nextLayer) {
      embed.addFields({ name: "Next Layer", value: serverInfo.nextLayer, inline: true });
    } else {
      embed.addFields({ name: "\u200B", value: "\u200B", inline: true });
    }

    embed
      .addFields(
        {
          name: "Players Online",
          value: `${serverInfo.playerCount.toString()}/${serverInfo.maxPlayerCount.toString()}`,
          inline: true,
        },
        { name: "Public Queue", value: serverInfo.publicQueue.toString(), inline: true },
        { name: "Whitelist Queue", value: serverInfo.whitelistQueue.toString(), inline: true },
        { name: "Round Time", value: duration.toFormat("hh:mm:ss"), inline: true }
      )
      .setFooter({
        text: this.buildFooter(position),
      });

    return embed;
  }

  public buildPlayerInfoLinkButton(messageId: string): ActionRowBuilder<ButtonBuilder> {
    const button = new ButtonBuilder()
      .setLabel("Go to players list")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://discordapp.com/channels/${this.settingsService.getGuildId()}/${this.settingsService.getPlayerChannelId()}/${messageId}`
      );

    return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  }

  public buildServerInfoLinkButton(messageId: string): ActionRowBuilder<ButtonBuilder> {
    const button = new ButtonBuilder()
      .setLabel("Go to server info")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://discordapp.com/channels/${this.settingsService.getGuildId()}/${this.settingsService.getServerChannelId()}/${messageId}`
      );

    return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  }

  public buildServerInfoErrorEmbed(
    squadServer: SquadServer,
    position: number,
    message?: string
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${squadServer.ip}:${squadServer.queryPort}`)
      .setDescription(
        message ? message : "Unexpected error occured. Could not retrieve server information."
      )
      .setFooter({
        text: this.buildFooter(position),
      });
  }

  public buildPlayerInfoEmbed(serverInfo: ServerInfo, team: Team, position: number): EmbedBuilder {
    if (!serverInfo.teams || serverInfo.rconMessage) {
      return this.buildPlayerInfoErrorEmbed(serverInfo, team, position);
    }

    const teams = serverInfo.teams;
    const teamStr = team == Team.ONE ? serverInfo.teamOne : serverInfo.teamTwo;
    const playerEmbed = new EmbedBuilder()
      .setTitle(`${serverInfo.serverName} - Team ${team}`)
      .setDescription(
        `**${serverInfo.layer}** - **${teamStr}** - **${teams.getPlayerCount(team)} Players**`
      )
      .setColor("#FF5555")
      .setFooter({
        text: this.buildFooter(position),
      });

    const squadFields = this.buildSquadEmbedFields(teams, team);
    const unassignedFields = this.buildUnassignedEmbedField(teams.getUnassigned(team));

    playerEmbed.addFields(squadFields);
    if (unassignedFields) {
      playerEmbed.addFields(unassignedFields);
    }

    return playerEmbed;
  }

  public buildPlayerInfoErrorEmbed(
    serverInfo: ServerInfo,
    team: Team,
    position: number
  ): EmbedBuilder {
    const errorMessage = serverInfo.rconMessage
      ? serverInfo.rconMessage
      : "Could not retrieve player information";

    const playerErrorEmbed = new EmbedBuilder()
      .setTitle(`${serverInfo.serverName} - Team ${team}`)
      .setDescription(`**${errorMessage}**`)
      .setColor("#FF5555")
      .setFooter({
        text: this.buildFooter(position),
      });

    return playerErrorEmbed;
  }

  private buildSquadEmbedFields(teams: Teams, team: Team): APIEmbedField[] {
    const fields: APIEmbedField[] = [];

    let squads = teams.getSquads(team);
    if (this.settingsService.sortSquadsBySize()) {
      squads = this.sortSquads(squads);
    }

    for (const [index, squad] of squads.entries()) {
      if (squad.players.length == 0) {
        this.logger.warn(
          "Squad [%s] has 0 players (reported size: [%s]) and will not be added to the player info embed",
          squad.name,
          squad.size
        );
        continue;
      }

      let playerValue = "";

      const squadName = this.settingsService.showSquadNames()
        ? `${squad.id} | ${squad.name}`
        : `Squad ${squad.id}`;

      for (const [index, player] of squad.players.entries()) {
        const playerName = this.sanitizePlayerName(player.name);
        const leaderEmoji = this.getLeaderEmoji(player.leader, squad.name);
        playerValue += `**${index + 1}.** ${playerName}${leaderEmoji}\n`;
      }

      const lock = squad.locked ? ":lock:" : ":unlock:";
      fields.push({
        name: `__${squadName}__ (${squad.size}) ${lock}`,
        value: playerValue,
        inline: true,
      });

      if (index % 2 == 0 && index != squads.length - 1) {
        fields.push({
          name: "\u200B",
          value: "\u200B",
          inline: true,
        });
      }
    }

    if (fields.length % 3 == 2) {
      fields.push({ name: "\u200B", value: "\u200B", inline: true });
    } else if (fields.length % 3 == 1) {
      fields[fields.length - 1].inline = false;
    }

    return fields;
  }

  private sortSquads(squads: Squad[]): Squad[] {
    return squads.sort((a, b) => a.size - b.size);
  }

  private buildUnassignedEmbedField(unassignedPlayers: Player[]): APIEmbedField[] | undefined {
    if (unassignedPlayers.length == 0) {
      return undefined;
    }

    const unassignedFields = [
      {
        name: "__Unassigned__",
        value: "",
        inline: true,
      },
      {
        name: `\u200B`,
        value: "\u200B",
        inline: true,
      },
      {
        name: `\u200B`,
        value: "",
        inline: true,
      },
    ];

    const half = Math.ceil(unassignedPlayers.length / 2);

    for (const [index, player] of unassignedPlayers.entries()) {
      const fieldIndex = index + 1 <= half ? 0 : 2;
      const playerName = this.sanitizePlayerName(player.name);
      unassignedFields[fieldIndex].value += `**${index + 1}.** ${playerName}\n`;
    }

    unassignedFields.forEach((field) => {
      if (field.value === "") {
        field.value = "\u200B";
      }
    });

    return unassignedFields;
  }

  private sanitizePlayerName(name: string): string {
    return name
      .replace("_", "\\_")
      .replace("*", "\\*")
      .replace("~", "\\~")
      .replace(">", "\\>")
      .replace("`", "\\`");
  }

  private getLeaderEmoji(isLeader: boolean, squadName: string): string {
    if (!isLeader) {
      return "";
    }

    if (squadName === "CMD Squad") {
      return " :star2:";
    } else {
      return " :star:";
    }
  }

  private buildFooter(position: number): string {
    const timestamp = DateTime.now()
      .setZone(this.settingsService.getTimeZone())
      .toFormat("dd.LL.yyyy HH:mm:ss");

    return `#${position} | Last update: ${timestamp}`;
  }
}
