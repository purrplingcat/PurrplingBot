const Core = require("./common/core");
const LOGGER = require("./lib/logger");
const PKG = require("./package.json");
const VERSION = PKG.version;
const CODENAME = PKG.codename;
const DEBUG = process.env.DEBUG || 0;


function init() {
  var logger = LOGGER.createLogger();
  var config;
  var store;

  // Print info about PurrplingBot
  logger.info("* PurrplingBot version " +  VERSION + " '" + CODENAME + "'");
  logger.info("* Runtime: Node " + process.version + "(" + process.platform + ") Pid: " + process.pid);
  logger.info("* Argv: " + process.argv);
  if (DEBUG > 0) logger.log("* DEBUG MODE ENABLED !! (level: %s)", DEBUG);

  logger.info("Starting PurrplingBot ...");

  try {
    const Configurator = require("./lib/configurator.js");
    config = Configurator.loadConfiguration("config/config");
  } catch (err) {
    logger.error("*** Configuration failed to load! Check the config file.");
    logger.error(err);
    process.exit(6);
  }

  // Init storage
  const Storage = require("./lib/storage.js");
  const STORAGE_CONF = config.storage || {};
  store = Storage(STORAGE_CONF.file || "config/storage.json");

  // No data in storage? Import defaults
  if (!store.countScopes()) {
    logger.info("Storage has no data! Restore defaults");
    store.import("extras/store.defaults.json");
    store.flush();
  };

  // module.exports instance of Core is now only for back compatibility, otherwise deprecated!
  var core = module.exports = new Core(config, store);
  core.run();
}

if (require.main === module) {
  init();
}
