# Squad server info Discord bot

A Discord bot to show [Squad](https://joinsquad.com/) server information in an embed in a Discord text channel

![bot-showcase](https://user-images.githubusercontent.com/24782633/210171593-96470974-541f-45a2-9c08-e6f2d1134512.png)

## Available Commands

- `/add-server <server-address>`
  - Adds a server to the bot. The bot will query server information from that server and show that information in an embed in a configured text channel
  - Example: `/add-server 45.91.103.14:27165`
- `/remove-server <server-position>`
  - Removes a server from the bot. The server information of that server will not be shown anymore. The position corresponds to the order of the servers in the message by the bot and can also be seen at the bottom left of the embed.
  - Example: `/remove-server 1`

The `server-address` has to contain the IP and Query-Port of the Squad server in the form of `IP:Port`. IP and Query-Port of a server can be found on [BattleMetrics.](https://www.battlemetrics.com)

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
After the bot has been added to your Discord server and the configuration has been set the bot can be started.
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
- `discord.guild`: ID of the Discord server where the bot will run. You can copy the ID by right-clicking on the server and pressing "Copy ID"
- `discord.serverInfoChannel`: ID of the Discord text channel where the bot will send the Squad server info messages. You can copy the ID by right-clicking on the text channel and pressing "Copy ID"
- `discord.messageUpdateIntervalSec`: Interval in seconds how often the bot will query the Squad servers and update the server info messages
- `discord.authorizedRoles`: Comma separated string of IDs by roles that will be able to add and remove Squad servers to the bot. You can copy the IDs in "Server Settings > Roles" by clicking the three dots and pressing "Copy ID"
- `logging.level`: Log level of log messages in the console. Valid values are "debug", "verbose", "info", "warn" and"error"
- `logging.level`: Format of log messages in the console. Valid values are "default" and "json"
