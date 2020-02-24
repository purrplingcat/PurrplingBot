const config = require("../config/config.js");
const purrplingbot = require("../dist/purrplingbot.js");
const container = purrplingbot.create(config);

console.info(`PurrplingBot version ${container.version} '${container.codename}'`);

container.purrplingBot.run();
