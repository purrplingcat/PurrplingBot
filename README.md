# PurrplingBot

A discordbot written primary for server PurrplingCat

**This project is under development!**

## Get PurrplingBot

### Regular download

* Latest stable version 1.3.2: [Release v1.3.2 'Carmilla'](https://github.com/EllenFawkes/PurrplingBot/releases/tag/1.3.2)
* Develop version 1.4.0-dev: `git clone https://github.com/EllenFawkes/PurrplingBot.git`

### Get image from DockerHub

```bash
# x86/x64 images
docker pull purrplingcat/purrplingbot:1.3.2 # Latest stable version 1.3.2 'Carmilla'
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

**Docker Setup/Migrate guide](https://gist.github.com/EllenFawkes/75c389714aa92a31a976d02d451e3e9c)**

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

1. Same as previous, however you need to `docker build --build-arg baseimage=arm64v8/node:8.5.0-slim -t <yourname>/purrlingbot-arm64 .` or whichever is relevant for your architecture.`

**NOTE:** At --build-arg you can place your own base image for different architectures or own baseimage. **This is not officially supported!**

## Bug reporting

If you find a bug, then report an issue on my github. REMEBER: PurrplingBot is in BETA!
