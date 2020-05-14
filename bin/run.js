require("dotenv/config");
const config = require("../config/config.js");
const purrplingbot = require("../dist/purrplingbot.js").default;

console.info(`PurrplingBot version ${purrplingbot.version} '${purrplingbot.codename}'`);

purrplingbot.run();
