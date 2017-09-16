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

### Migrate: 1.2.3 -> 1.3.0

- Move your _config.json_ to **config/config.json**
- Add `eventLogger` default config:

```json
"eventLogger": {
  "enabled": false,
  "loggingChannelID": "353532218712522753"
}
```

- To your config file add new node for configure Announcer plugin:

```json
"announcer": {
  "antispam": true,
  "inactivity": "45m",
  "activityLinesThreshold": 1,
  "repeater": {
    "enabled": false,
    "expirePercentTime": 0.25,
    "handleWait": "2m"
  }
}
```

NOTE: If you want allow Announce repeater, then change key `enabled` to `true` in `announcer/repeater`

- Add a node `storage`

```json
"storage": {
  "file": "config/storedb.json",
  "autosave": true,
  "autosaveInterval": 90
}
```

- Add a node `twitchcord`

```json
"twitchcord": {
  "username": "<twitch_username>",
  "password": "oauth:<your oauth token>",
  "twitchChannel": "#<your_twitch>channel>",
  "discordChannelId": "<your_discord_chanID_to_connect_with_twitch>"
}
```

- Add a node `greetings` ChannelID usually of channel #general for greetings

```json
"greetings": {
  "channelID": "<your_greeting_chanID>",
  "greetingMessage": "Vítej mezi námi!"
}
```

- To node `twitch` add a node `twitch_stream_checker`

```javascript
"twitch_stream_checker": {
  "enabled": true,
  "interval": 300,
  "announceChannelId": "<announcements_channel_ID>"
}
```

- If you want mumbles in mumblebox plugin, then add super-node `@imports` at begin of config file. This node is magic. It import a external JSON file to a node in ROOT. `nodeToByImported: JSONFileToImport`

```json
"@imports": {
  "mumblebox": "extras/mumblebox.json",
  "catsnack": "extras/catsnack.json",
  "catnature": "extras/catnature.json"
}
```

NOTE: If you want use own extras configs, then copy _<extras_conf>.json_ from _extras/_ to _config/_ and edit it. After this process update a `@import` line for catnature and link _<extras_conf>.json_ from _config/_

NOTE: Don't forget commas `,`

### Migrate: 1.2.1 -> 1.2.2 or above from 1.2.x series

- Add a `"ignoredChannelIDs": [],` to a begin of JSON if you used own. You can specify channel IDs to ignore for bot's mumbling
