const LOGGER = require("./logger.js");
var logger = LOGGER.createLogger("Configurator");

var path = [];

function readConfigFile(jsonFileName) {
  try {
    fs = require('fs');
    var json = fs.readFileSync(jsonFileName, 'utf8').toString();
    logger.log("Loaded config file: %s", jsonFileName);
    return JSON.parse(json);
  } catch(err) {
    logger.error("Failed while reading %s - %s", jsonFileName, err);
    logger.log(err);
    return null;
  }
}

function loadImports(root, imports) {
  for (nodeToImport in imports) {
    path.push(nodeToImport);
    var file = imports[nodeToImport];
    logger.info("Importing node '/%s' from: %s", path.join('/'), file);
    var data = loadConfigFile(file);
    if (!data) {
      throw new Error("Can't import node '" + nodeToImport + "' from: " + file);
    }
    root[nodeToImport] = data;
    path.slice(nodeToImport);
    logger.log("Node '/%s' imported from: %s", path.join('/'), file);
  }
}

function loadConfigFile(configFile) {
  logger.log("Trying to load configuration file: %s", configFile);
  var _config = readConfigFile(configFile);
  if (!_config) {
    throw new Error("Configuration can't be loaded!");
  }
  if (_config["@imports"]) {
    logger.log("Trying to import config files from @imports in /%s", path.join('/'));
    logger.dir(_config["@imports"]);
    loadImports(_config, _config["@imports"]);
    delete _config["@imports"]
  }
  logger.dir(_config);
  logger.log("Configuration loaded! Config file: %s, @imports: %s", configFile, (_config["@imports"] ? Object.keys(_config["@imports"]).length : 0));
  return _config;
}

function loadConfiguration(configFile) {
  logger.info("Loading configuration from: %s ...", configFile);
  path = []; // Explicit reset path
  return loadConfigFile(configFile);
}

exports.loadConfiguration = loadConfiguration;
exports.readConfigFile = readConfigFile;
