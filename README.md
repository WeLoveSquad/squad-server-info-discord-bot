# Squad server info Discord bot

A Discord bot to show [Squad](https://joinsquad.com/) server and player information in embeds in Discord text channels. \
The bot uses `RCON` to retrieve the information that is shown in the embeds.

## Server Information

Prior to `Squad v7` the server information could be retrieved from a public server query endpoint that did not require any credentials to retrieve the data.
Since Squad has been moved to Epic Online Services (EOS) with the v7 update, the squad servers do not offer such an endpoint any more.
Due to this, the bot can now only query general server information with an authorized RCON-Connection by using the `ShowServerInfo` command.

The image below shows an example of how the embeds that contain the server information look like.

![embed-showcase](https://github.com/WeLoveSquad/squad-server-info-discord-bot/assets/24782633/01f69880-8a05-413b-885d-694983b7a676)


## Player Information

The player information is also retrieved from an RCON-Connection by using the `ListSquads` and `ListPlayers` command. \
The image below shows how an embed of a Team will look like. The bot will send a message for each Server with an RCON-Connection. Each message contains two player information embeds for both teams.

![grafik](https://user-images.githubusercontent.com/24782633/218317356-894acdc2-51c3-4141-932d-1e1cebf42e94.png)

## Available Commands

- `/init`
  - Initialize the bot to send server information in the channel where the `/init` command was used
  - If the server information has already been initialized in a channel it is possible to use `/init` in another channel. The bot will then delete it's current message and send all future server information in the other channel that was newly initialized
  - Example: `/init`
- `/init-player-info`
  - Will only have an effect for servers that include an `RCON-Port` and `RCON-Password` in the config
  - Initialize the bot to send player information in the channel where the `/init-player-info` command was used
  - Requires that the server information has been initialized with `/init`
  - If the player information has already been initialized in a channel it is possible to use `/init-player-info` in another channel. The bot will then delete it's current player information messages and send all future player information in the other channel that was newly initialized
  - It is also possible to use `/init-player-info` in the same channel where `/init` was used
  - Example: `/init-player-info`
- `/remove-player-info`
  - Deletes all previously sent player information embeds and stops querying new player information from the RCON-Connection
  - Example: `/remove-player-info`
- `/set-interval <interval>`
  - Sets the interval in seconds in which the bot will query the Squad Servers and update the server information and player information embeds
  - The default interval is `15 seconds`
  - The smalles allowed interval is also `15 seconds`
  - Example: `/set-interval 15`
- `/set-time-zone <time-zone>`
  - The bot shows date and time in the bottom left corner in each embed to show when that embed was updated for the last time. This command allows you to modify the time zone for that date
  - `<time-zone>` must be a valid IANA time zone database value. You can find available time zone names [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
  - The default time zone is `Europe/Berlin`
  - Example: `/set-time-zone America/New_York`
- `/show-next-layer <True | False>`
  - Configure whether the next layer should be shown in the server information embed
  - The default value is `True`
  - `/show-next-layer True`
- `/show-squad-names <True | False>`
  - If an RCON-Port and correct RCON-Password are provided the bot will also be able to request information about players and squads in each team and display them in an embed. With this command you can configure if the names of the squads should be shown or not. If `False` is used the squad names will be replaced with `Squad 1`, `Squad 2` and so on.
  -  The default value is `True`
  - Example: `/show-squad-names True`
- `/show-squad-leader <True | False>`
  - If set to `True`, squad leaders will have a star emoji (⭐) next to their name and will always be shown at the top of the squad in the player information embeds. If `show-squad-leader` is set to `False` then the players in the embed will be sorted by their names and the star emoji will not be set.
  - The default value is `True`
  - Example: `/show-squad-leader True`
- `/show-commander <True | False>`
  - Will only have an effect if `show-squad-leader` is set to `True`
  - Squad leaders will have this emoji next to their name: ⭐ in the player information embeds. If `show-commander` is set to `True`, then the commander will have this emoji next to their name: 🌟. If it is set to `False` then the commander will also have the default squad leader emoji (⭐) next to their name to make them indistinguishable.
  - The default value is `True`
  - Example: `/show-commander True`
- `/sort-squads <True | False>`
  - Sorts the squads in the player-info-embed by their size from small to big
  - Normally squads are sorted by their ID. This can lead to the problem that small squads are shown next to big squads and thus the embed contains big empty spaces. Sorting the squads by their size will reduce the size of empty space in the embed but the squads will not be in the same order as ingame
  - The default value is `False`
  - Example: `/sort-squads True`

## Creating a bot and adding it to your server

To create and add a Discord bot to your server please follow [this guide.](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links)

In the `URL Generator` under `OAuth2` the only needed Bot-Permissions are `Send Messages` and `Manage Messages` in the `Text Permissions` column.

## Deployment with Docker
### Config

The bot has to be configured before deployment.
This can be done in one of two ways:

1. Configure all environment variables in `docker-compose.yml`. These environment variables correspond to the config values configured in `config/custom-environment-variables.json5`. See [Config values](#config-values) for all available configurations.
2. Copy `default.json5` into `production.json` and configure all config values in that file. When using this approach you have to remove all unneeded environment variables in `docker-compose.yml`. Otherwise these values will overwrite the values in `production.json`.

### Starting the application
Once the bot is added to your server and fully configured, the bot can be started
```bash
# Build and start
docker-compose up --build

# Stop the bot
docker-compose stop
```

## Local development
### Config

The bot needs to be configured before it can run.
All available config values can be found in `/config/default.json5`

Create a copy of `default.json5` and rename it to `local-development.json5`.
In `local-development.json5` you can configure all needed values for local developent. See [Config values](#config-values) for all available configurations.

### Starting the application
```bash
# install packages
npm install

# start the application
npm run start
# or you can start the application with auto reload
npm run dev
```

## Config values
- `discord.botToken`: Secret Token of your Discord bot
- `discord.authorizedRoles`: Comma separated string of IDs by roles that will be able to add and remove Squad servers to the bot. You can copy the IDs in `Server Settings > Roles` by clicking the three dots next to a role and pressing `Copy ID`
- `squad.servers`: Comma separated string of Squad-Servers from which the bot will query information
  - Format:
    - `<IP>:<RCON-Port>:<RCON-Password>`
      - Example: `55.66.77.88:12345:password`
    - To use multiple servers in the config use a comma to separate the servers:
      - `11.22.33.44:54321:password1,55.66.77.88:12345:password2`
- `logging.level`: Log level of log messages in the console. Valid values are `debug`, `verbose`, `info`, `warn` and `error`
- `logging.format`: Format of log messages in the console. Valid values are `default` and `json`
