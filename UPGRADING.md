## Upgrading to new version

Valid for version(s): **1.2.x**

## Upgrading bot

### Standalone users

- Backup previos version (config files, app and etc)
- Download new version in [Releases](https://github.com/EllenFawkes/PurrplingBot/releases)
- Unpack a ZIP or TGZ package to a destination with your previous version of bot
- Migrate configs (see [Configuration migration](#configuration-migration))
- Restart bot

### Docker users

If you running PurrplingBot as Docker container, follow master instructions [Setup (or upgrade) PurrplingBot via Docker](https://gist.github.com/EllenFawkes/75c389714aa92a31a976d02d451e3e9c) and use Docker migration tools.

Migrate your configs by steps in [Configuration migration](#configuration-migration)

## Configuration migration

### Migrate: 1.2.1 -> 1.2.2

- Add a `"ignoredChannelIDs": [],` to a begin of JSON if you used own. You can specify channel IDs to ignore for bot's mumbling
