const config = require("../config/config.js");
const purrplingbot = require("../dist/purrplingbot.js");
const botRunner = purrplingbot.create(config);

console.info(`PurrplingBot version ${botRunner.version} '${botRunner.codename}'`);

botRunner.run();
