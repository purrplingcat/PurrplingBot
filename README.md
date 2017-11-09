# PurrplingBot

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/fb1bf86ff5334ab2a8b7c99c36347813)](https://www.codacy.com/app/ellenfawkes/PurrplingBot?utm_source=github.com&utm_medium=referral&utm_content=EllenFawkes/PurrplingBot&utm_campaign=badger)
[![CircleCI](https://circleci.com/gh/EllenFawkes/PurrplingBot.svg?style=svg)](https://circleci.com/gh/EllenFawkes/PurrplingBot)

A customizable discordbot written primary for server PurrplingCat

**This project is under development!**

## Main features

- Extensible and customizable via plugins (plugins can be enabled or disabled optionally)
- Chat bridge betwen Discord and Twitch chat
- Twitch stream checker (Automatically check when you are streaming, or check it via `!livenow`)
- Announcer (send a message in intervals, announcer can be handled when channel is active. Setup announce via !announce)
- Own cron sheduler for bot actions (send message, change avatar) - You can write your own cron handler
- Funny functions: Give a snack for bot, bot mumbling, cat nature - Yes this bot is cat!
- Itegrates Urbandictionary `!urban`, Giphy `!giphy`
- Wordcounter with score table (commands `!words`, `!messages`, `!fame`)
- Create a polls via `!poll`
- Aliases support - Create your command alias via `!alias`
- Bot greetings newbies
- Built-in commands: `!alias`, `!alias_remove`, `!uptime`, `!version`
- and more ...

### Features for admins and developers

- Based on Discord.js (version 11.2)
- Event logging to a secret discord channel (Yo can define it in config)
- Event bus - Emit&Handle bot's events
- Easy but sophisticated API for plugin development (WIP)
- Data storage
- Advanced configuration (YAML, file inclusion, config merge (WIP))
- Writing own commands in plugins
- User permissons and roles (ACL)
- Docker ready
- Supported architectures: x86_64, arm64

## Get PurrplingBot

### Regular download

* Latest stable version 1.3.4: [Release v1.3.4 'Carmilla'](https://github.com/EllenFawkes/PurrplingBot/releases/tag/1.3.4)
* Release candidate version 1.4.0: [Release v1.4.0-rc 'Carmilla'](https://github.com/EllenFawkes/PurrplingBot/releases/tag/1.4.0-rc)
* Develop version: `git clone https://github.com/EllenFawkes/PurrplingBot.git`

### Get image from DockerHub

```bash
# x86/x64 images
docker pull purrplingcat/purrplingbot:1.3.4 # Latest stable version 1.3.4 'Carmilla'
docker pull purrplingcat/purrplingbot:latest # Latest development version

# arm64 images
docker pull purrplingcat/purrplingbot-arm64:latest # Latest development version
```

**NOTE:** Arm64 images is not always up2date.

**[Docker Setup/Migrate guide](https://gist.github.com/EllenFawkes/75c389714aa92a31a976d02d451e3e9c)**

## Install & Run

### Install stable (standalone)

1. Rename config/config.example.json to config/config.json `mv config/config.example.json config/config.json`
2. Edit config/config.json and put your configuration (credentials, prefix, etc)
4. Install NPM dependencies `npm install --production`
5. Run PurrplingBot `npm start` or `node purrplingbot.js`

### Install dev

**Requires cloned latest _master_ branch**

1. Rename config/config.example.json to config/config.json `mv config/config.example.yaml config/config.yaml`
2. Edit config/config.json and put your configuration (credentials, prefix, etc)
4. Install NPM dependencies `npm install`
5. Install NPM dependencies for plugins `npm depmod`
6. Run PurrplingBot `npm start` or `node purrplingbot.js`

**NOTE:** If you run bot via `node purrplingbot.js` you hasn't availaible autoreload after config was changed!

### Run tests (dev)

If you want run tests, then run `npm test`. It requires installed _devDependencies_ (only for developers)

## Docker, Kubelet (x86/x64, arm64)

#### Docker Quickstart

**[Docker Setup/Migrate guide](https://gist.github.com/EllenFawkes/75c389714aa92a31a976d02d451e3e9c)**

#### Pull image from DockerHub

```bash
docker pull purrplingcat/purrplingbot:<version>
docker run -ti purrplingcat/purrplingbot:<version>
```

#### Run via kubelet/static POD for Kubernetes
1. Download _extras/purrplingbot-kubernetes.yaml_
2. Replace `__VERSION__` with desired version
3. Replace `__CONFIG_PATH__` with path to configs
4. Replace `__LOG_PATH__` with path to logs
5. Deploy to Kubernetes by normal means

#### Build your own x86/x64 image

1. Create a config file `mv config/config.example.json config/config.json`
2. Configure your bot `vim config/config.json`
3. Build your Docker image `docker build -t <yourname>/purrplingbot .`
4. Run your container `docker run -ti <yourname>/purrplingbot`

#### Build your own ARM64 image

1. Same as previous, however you need to `docker build --build-arg baseimage=arm64v8/node:8.5.0-slim -t <yourname>/purrlingbot-arm64 .` or whichever is relevant for your architecture.

**NOTE:** At --build-arg you can place your own base image for different architectures or own baseimage. **This is not officially supported!**

## Maintenance

| Version | Codename | Released   | EOL       | Maintained |
|---------|----------|------------|-----------|------------|
| 1.3     | Carmilla | 2017-09-23 | Dec, 2017 | YES        |
| 1.2     | Carmilla | 2017-07-30 | Oct, 2017 | NO         |
| 1.1     | Chiara   | 2017-07-26 | Sep, 2017 | NO         |
| 1.0     |          | 2017-06-11 | Jul, 2017 | NO         |

## Bug reporting

If you find a bug, then report an issue on my github. REMEBER: PurrplingBot is in BETA!
