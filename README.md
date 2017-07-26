# PurrplingBot
A discordbot written primary for server PurrplingCat

**BETA version - This project is under development!**

## Get PurrplingBot

### Regular download

* Stable version 1.1.0: [Release v1.1.0 'Chiara'](https://github.com/EllenFawkes/PurrplingBot/releases/tag/v1.1.0)
* Develop version 1.2.0-dev: `git clone https://github.com/EllenFawkes/PurrplingBot.git`
* Legacy version 1.0.8: [Gist purrplingbot.js](https://gist.github.com/EllenFawkes/db76540a8d4aa124114f9b7bc649e605)

### Get image from DockerHub

```bash
docker pull purrplingcat/purrplingbot:1.1.0 # Stable version 1.1.0 'Chiara'
docker pull purrplingcat/purrplingbot:latest # Latest development version
```

## Install (dev)

1. Rename config.example.json to config.json `mv config.example.json config.json`
2. Edit config.json and put your configuration (credentials, prefix, etc)
4. Install NPM dependencies `npm install`
5. Run PurrplingBot `npm start` or `node purrplingbot.js`

OPTIONAL:
You can disable plugins, where you don't want. Create file `plugins/plugins_disabled.json` and define plugins to disable. Plugin equals to directory names in plugins/

```json
[
  "Nextstream",
  "Meowii"
]
```

## Docker Quickstart

### Pull image from DockerHub

```bash
docker pull purrplingcat/purrplingbot
docker run -ti purrplingcat/purrplingbot
```
### Build your own Docker image

1. Create a config file `mv config.example.json config.json`
2. Build your Docker image `docker build -t <yourname>/purrplingbot .`
3. Run your container `docker run -ti <yourname>/purrplingbot`

## Bug reporting

If you find a bug, then report an issue on my github. REMEBER: PurrplingBot is in BETA!
