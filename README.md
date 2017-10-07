# PurrplingBot

A discordbot written primary for server PurrplingCat

**This project is under development!**

## Get PurrplingBot

### Regular download

* Latest stable version 1.3.4: [Release v1.3.4 'Carmilla'](https://github.com/EllenFawkes/PurrplingBot/releases/tag/1.3.4)
* Develop version: `git clone https://github.com/EllenFawkes/PurrplingBot.git`

### Get image from DockerHub

```bash
docker pull purrplingcat/purrplingbot:1.3.4 # Latest stable version 1.3.4 'Carmilla'
docker pull purrplingcat/purrplingbot:latest # Latest development version
```

**[Docker Setup/Migrate guide](https://gist.github.com/EllenFawkes/75c389714aa92a31a976d02d451e3e9c)**

## Install (dev)

1. Rename config/config.example.json to config/config.json `mv config/config.example.json config/config.json`
2. Edit config/config.json and put your configuration (credentials, prefix, etc)
4. Install NPM dependencies `npm install`
5. Run PurrplingBot `npm start` or `node purrplingbot.js`

OPTIONAL:
You can disable plugins, where you don't want. Create file `config.json`, in node `pluginsDisabled` define plugins to disable. Plugins equals to directory names in plugins/

```json
"pluginsDisabled": [
  "Nextstream",
  "Meowii"
]
```

## Docker Quickstart

### [Docker Setup/Migrate guide](https://gist.github.com/EllenFawkes/75c389714aa92a31a976d02d451e3e9c)

### Pull image from DockerHub

```bash
docker pull purrplingcat/purrplingbot:<version>
docker run -ti purrplingcat/purrplingbot:<version>
```

### Run via kubelet/static POD for Kubernetes
1. Download _extras/purrplingbot-kubernetes.yaml_
2. Replace `__VERSION__` with desired version
3. Replace `__CONFIG_PATH__` with path to configs
4. Replace `__LOG_PATH__` with path to logs
5. Deploy to Kubernetes by normal means

### Build your own Docker image

1. Create a config file `mv config/config.example.json config/config.json`
2. Configure your bot `vim config/config.json`
3. Build your Docker image `docker build -t <yourname>/purrplingbot .`
4. Run your container `docker run -ti <yourname>/purrplingbot`

## Bug reporting

If you find a bug, then report an issue on my github. REMEBER: PurrplingBot is in BETA!
