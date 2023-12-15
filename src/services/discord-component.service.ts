import {
  APIEmbedField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { DateTime, Duration } from "luxon";
import { injectable } from "tsyringe";
import { Player } from "../entities/player.entity.js";
import { Squad } from "../entities/squad.entity.js";
import { Team, Teams } from "../entities/teams.entity.js";
import { Logger } from "../logger/logger.js";
import { ServerInfo, ServerStatus } from "./server-info.service.js";
import { SettingsService } from "./settings.service.js";

@injectable()
export class DiscordComponentService {
  private logger = new Logger(DiscordComponentService.name);

  constructor(private settingsService: SettingsService) {}

  public buildServerInfoEmbed(serverInfo: ServerInfo, position: number): EmbedBuilder {
    const status = serverInfo.status == ServerStatus.Online ? "✅ **Online**" : "❌ **Offline**";
    const title = serverInfo.serverName ?? `${serverInfo.ip}`;
    const layer = serverInfo.layer ?? "-";
    const publicQueue = serverInfo.publicQueue?.toString() ?? "-";
    const whitelistQueue = serverInfo.whitelistQueue?.toString() ?? "-";
    const nextLayer = serverInfo.nextLayer ?? "-";
    const thumbnail = serverInfo.layer
      ? `https://squadmaps.com/img/maps/full_size/${serverInfo.layer}.jpg`
      : null;
    const teams =
      serverInfo.teamOne && serverInfo.teamTwo
        ? `${serverInfo.teamOne} - ${serverInfo.teamTwo}`
        : "-";
    const playersOnline =
      serverInfo.playerCount !== undefined && serverInfo.maxPlayerCount !== undefined
        ? `${serverInfo.playerCount.toString()}/${serverInfo.maxPlayerCount.toString()}`
        : "-";
    const roundTime = serverInfo.playtimeSeconds
      ? Duration.fromObject({ seconds: serverInfo.playtimeSeconds }).toFormat("hh:mm:ss")
      : "-";

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(status)
      .setColor("#FF5555")
      .setThumbnail(thumbnail)
      .addFields(
        { name: "Layer", value: layer, inline: true },
        { name: "Teams", value: teams, inline: true },
        { name: "Round Time", value: roundTime, inline: true },
        { name: "Players Online", value: playersOnline, inline: true },
        { name: "Public Queue", value: publicQueue, inline: true },
        { name: "Whitelist Queue", value: whitelistQueue, inline: true }
      )
      .setFooter({
        text: this.buildFooter(position),
      });

    if (this.settingsService.showNextLayer() && serverInfo.nextLayer) {
      embed.addFields({ name: "Next Layer", value: nextLayer });
    }

    return embed;
  }

  public buildPlayerInfoEmbeds(
    serverInfo: ServerInfo,
    teams: Teams | undefined,
    position: number
  ): [EmbedBuilder, EmbedBuilder] {
    if (!teams) {
      return [
        this.buildPlayerInfoErrorEmbed(serverInfo, 1, position),
        this.buildPlayerInfoErrorEmbed(serverInfo, 2, position),
      ];
    }

    return [
      this.buildPlayerInfoEmbed(serverInfo, teams, 1, position),
      this.buildPlayerInfoEmbed(serverInfo, teams, 2, position),
    ];
  }

  private buildPlayerInfoEmbed(
    serverInfo: ServerInfo,
    teams: Teams,
    team: Team,
    position: number
  ): EmbedBuilder {
    const teamStr = team === 1 ? serverInfo.teamOne : serverInfo.teamTwo;
    const playerEmbed = new EmbedBuilder()
      .setTitle(`${serverInfo.serverName}`)
      .setDescription(
        `**Team ${team}** - **${teams.getPlayerCount(team)} Players** - **${teamStr}**`
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
    const serverName = serverInfo.serverName ?? `${serverInfo.ip}`;
    const playerErrorEmbed = new EmbedBuilder()
      .setTitle(`${serverName} - Team ${team}`)
      .setDescription(":x: Could not retrieve player information")
      .setColor("#FF5555")
      .setFooter({
        text: this.buildFooter(position),
      });

    return playerErrorEmbed;
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

  private buildSquadEmbedFields(teams: Teams, team: Team): APIEmbedField[] {
    const fields: APIEmbedField[] = [];

    let squads = teams.getSquads(team);
    if (this.settingsService.sortSquadsBySize()) {
      squads = this.sortSquads(squads);
    }

    for (const [squadIndex, squad] of squads.entries()) {
      if (squad.players.length === 0) {
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
      const players = this.settingsService.showSquadLeader()
        ? squad.players
        : squad.players.sort((a, b) => a.name.localeCompare(b.name));

      for (const [playerIndex, player] of players.entries()) {
        const playerName = this.sanitizePlayerName(player.name);
        const leaderEmoji = this.getLeaderEmoji(player.leader, squad.name);
        playerValue += `**${playerIndex + 1}.** ${playerName}${leaderEmoji}\n`;
      }

      const lock = squad.locked ? ":lock:" : ":unlock:";
      fields.push({
        name: `__${squadName}__ (${squad.size}) ${lock}`,
        value: playerValue,
        inline: true,
      });

      if (squadIndex % 2 === 0 && squadIndex !== squads.length - 1) {
        fields.push({
          name: "\u200B",
          value: "\u200B",
          inline: true,
        });
      }
    }

    if (fields.length % 3 === 2) {
      fields.push({ name: "\u200B", value: "\u200B", inline: true });
    } else if (fields.length % 3 === 1) {
      fields[fields.length - 1].inline = false;
    }

    return fields;
  }

  private sortSquads(squads: Squad[]): Squad[] {
    return squads.sort((a, b) => a.size - b.size);
  }

  private buildUnassignedEmbedField(unassignedPlayers: Player[]): APIEmbedField[] | undefined {
    if (unassignedPlayers.length === 0) {
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
      .replaceAll("_", "\\_")
      .replaceAll("*", "\\*")
      .replaceAll("~", "\\~")
      .replaceAll(">", "\\>")
      .replaceAll("`", "\\`");
  }

  private getLeaderEmoji(isLeader: boolean, squadName: string): string {
    if (!isLeader || !this.settingsService.showSquadLeader()) {
      return "";
    }

    if (this.settingsService.showCommander() && squadName === "Command Squad") {
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
