const config = require("../config/config.js");
const purrplingbot = require("../dist/purrplingbot.js");
const bot = purrplingbot.create(config);

console.info(`PurrplingBot version ${bot.version} '${bot.codename}'`);

bot.run();
