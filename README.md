# squad-server-info-discord-bot

A discord bot to show squad server information in an embed in a discord text channel

![bot-showcase](https://user-images.githubusercontent.com/24782633/210171593-96470974-541f-45a2-9c08-e6f2d1134512.png)

## Local development

### Config

The bot needs to be configured before it can run.
All available config values can be found in `/config/default.json5`

Create a copy of `default.json5` and rename it to `local-development.json5`.
In `local-development.json5` you can configure all needed values for local developent.

**Config Values**:
- `discord.botToken`: Secret Token of your discord bot
- `discord.guild`: ID of the discord server where the bot will run. You can copy the ID by right-clicking on the server and pressing "Copy ID"
- `discord.serverInfoChannel`: ID of the discord text channel where the bot will send the squad server info messages. You can copy the ID by right-clicking on the text channel and pressing "Copy ID"
- `discord.messageUpdateIntervalSec`: Interval in seconds how often the bot will query the squad servers and update the server info messages
- `discord.authorizedRoles`: Comma separated string of IDs by roles that will be able to add and remove squad servers to the bot. You can copy the IDs in "Server Settings > Roles" by clicking the three dots and pressing "Copy ID"
- `logging.level`: Log level of log messages in the console. Valid values are "debug", "verbose", "info", "warn" and"error"
- `logging.level`: Format of log messages in the console. Valid values are "default" and "json"
- `storage.path`: The bot does not use a database and thus stores the added servers in a json file in this directory

### Starting the application
```bash
# install packages
npm install

# start the application
npm run start
# or you can start the application with auto reload
npm run dev
```
