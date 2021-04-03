const chalk = require("chalk");
const config = require("../config/config.js");
const purrplingbot = require("../dist/purrplingbot.js");

console.info(chalk.hex("#FF00FF").bold(`PurrplingBot version ${purrplingbot.VERSION} '${purrplingbot.CODENAME}'`));

purrplingbot.create(config).run();
