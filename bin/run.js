const config = require("../config/config.js");
const pkg = require("../package.json");
const purrplingbot = require("../dist/purrplingbot.js");
const bot = purrplingbot.create(config);

console.info(`PurrplingBot version ${pkg.version} '${pkg.codename}'`);

bot.run();
